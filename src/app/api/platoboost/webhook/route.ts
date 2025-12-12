import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

function getRealIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || '0.0.0.0';
  return '0.0.0.0';
}

/**
 * POST /api/platoboost/webhook
 * 
 * Receives callbacks from Platoboost when user completes offer
 * 
 * Platoboost sends: POST with JSON body or query params
 * Expected: { subid: session_id, status: 'completed', ... }
 * 
 * SECURITY: Verify signature if Platoboost provides one
 */
export async function POST(request: NextRequest) {
  const ipAddress = getRealIP(request);
  
  try {
    // Parse body and query params
    let body: any = {};
    let queryParams: any = {};
    
    try {
      body = await request.json();
    } catch {
      // If body is not JSON, try form data or query params
      const { searchParams } = new URL(request.url);
      queryParams = Object.fromEntries(searchParams.entries());
    }

    const data = { ...body, ...queryParams };
    
    console.log('🔔 Platoboost webhook received:', {
      ip: ipAddress,
      body: data,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'content-type': request.headers.get('content-type')
      }
    });

    // Extract session_id (could be 'subid', 'id', 'session_id', etc.)
    const sessionId = data.subid || data.id || data.session_id || data.user_id;
    
    if (!sessionId) {
      console.error('❌ Webhook missing session identifier');
      
      // Log failed callback
      await supabase.from('platoboost_callbacks').insert({
        received_at: new Date().toISOString(),
        ip_address: ipAddress,
        body: body,
        query_params: queryParams,
        verification_status: 'invalid',
        processed: false,
        error_message: 'Missing session identifier'
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Missing session identifier' 
      }, { status: 400 });
    }

    // Verify signature if Platoboost provides one
    const signature = data.signature || request.headers.get('x-platoboost-signature');
    const secretKey = process.env.PLATOBOOST_SECRET_KEY || '';
    
    let verificationStatus = 'valid';
    
    if (signature && secretKey) {
      // Verify HMAC signature
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(JSON.stringify(data))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        verificationStatus = 'invalid_signature';
        
        await supabase.from('platoboost_callbacks').insert({
          session_id: sessionId,
          received_at: new Date().toISOString(),
          ip_address: ipAddress,
          body: body,
          query_params: queryParams,
          verification_status: 'invalid_signature',
          processed: false,
          error_message: 'Signature mismatch'
        });
        
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid signature' 
        }, { status: 403 });
      }
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('platoboost_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ Session not found:', sessionId);
      
      await supabase.from('platoboost_callbacks').insert({
        session_id: sessionId,
        received_at: new Date().toISOString(),
        ip_address: ipAddress,
        body: body,
        query_params: queryParams,
        verification_status: verificationStatus,
        processed: false,
        error_message: 'Session not found'
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Check if session already completed
    if (session.status === 'completed' || session.status === 'key_issued') {
      console.log('⚠️ Session already completed:', sessionId);
      
      await supabase.from('platoboost_callbacks').insert({
        session_id: sessionId,
        received_at: new Date().toISOString(),
        ip_address: ipAddress,
        body: body,
        query_params: queryParams,
        verification_status: verificationStatus,
        processed: true,
        error_message: 'Already completed'
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Already processed' 
      });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      console.error('❌ Session expired:', sessionId);
      
      await supabase
        .from('platoboost_sessions')
        .update({ status: 'expired' })
        .eq('session_id', sessionId);
      
      await supabase.from('platoboost_callbacks').insert({
        session_id: sessionId,
        received_at: new Date().toISOString(),
        ip_address: ipAddress,
        body: body,
        query_params: queryParams,
        verification_status: verificationStatus,
        processed: false,
        error_message: 'Session expired'
      });
      
      return NextResponse.json({ 
        success: false, 
        error: 'Session expired' 
      }, { status: 410 });
    }

    // Mark session as completed
    await supabase
      .from('platoboost_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        callback_received_at: new Date().toISOString(),
        callback_data: data
      })
      .eq('session_id', sessionId);

    // Log successful callback
    await supabase.from('platoboost_callbacks').insert({
      session_id: sessionId,
      received_at: new Date().toISOString(),
      ip_address: ipAddress,
      body: body,
      query_params: queryParams,
      verification_status: verificationStatus,
      processed: true
    });

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'platoboost_completed',
      severity: 'info',
      message: `Platoboost offer completed for ${session.provider}`,
      session_id: sessionId,
      ip_address: ipAddress,
      discord_id: session.discord_id,
      metadata: { provider: session.provider, callback_data: data }
    });

    console.log(`✅ Platoboost webhook processed: ${sessionId.substring(0, 16)}... (${session.provider})`);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('Error processing Platoboost webhook:', error);
    
    await supabase.from('platoboost_callbacks').insert({
      received_at: new Date().toISOString(),
      ip_address: ipAddress,
      verification_status: 'error',
      processed: false,
      error_message: error.message
    });
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
