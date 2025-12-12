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

function hashUserAgent(ua: string): string {
  return crypto.createHash('sha256').update(ua).digest('hex');
}

/**
 * POST /api/platoboost/get-link
 * 
 * Gets Platoboost offer link for user
 * 
 * Body: { discord_id?: string }
 * Returns: { success: true, session_id: string, offer_url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discord_id } = body;

    const serviceId = process.env.PLATOBOOST_SERVICE_ID;
    const baseUrl = process.env.PLATOBOOST_BASE_URL || 'https://api.platoboost.com';

    if (!serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Platoboost not configured. Add PLATOBOOST_SERVICE_ID to env.'
      }, { status: 500 });
    }

    const ipAddress = getRealIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const userAgentHash = hashUserAgent(userAgent);

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Generate identifier (HWID) - sha256 of session + IP + UA
    // In production, this should be from client device fingerprint
    const identifierSeed = `${sessionId}-${ipAddress}-${userAgentHash}`;
    const identifier = crypto.createHash('sha256').update(identifierSeed).digest('hex');

    console.log('🔐 Generated identifier:', identifier.substring(0, 16) + '...');

    // Call Platoboost API: POST /public/start
    const startResponse = await fetch(`${baseUrl}/public/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: parseInt(serviceId),
        identifier: identifier
      })
    });

    const startData = await startResponse.json();

    // Log API call
    await supabase.from('platoboost_api_log').insert({
      session_id: sessionId,
      endpoint: '/public/start',
      method: 'POST',
      request_body: { service: parseInt(serviceId), identifier: identifier.substring(0, 16) + '...' },
      response_status: startResponse.status,
      response_body: startData,
      success: startResponse.ok
    });

    if (!startResponse.ok || !startData.data?.url) {
      console.error('Platoboost /public/start failed:', startData);
      return NextResponse.json({
        success: false,
        error: startData.message || 'Failed to get offer link from Platoboost'
      }, { status: 500 });
    }

    const offerUrl = startData.data.url;

    // Save session to database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const { error: insertError } = await supabase
      .from('platoboost_sessions')
      .insert({
        session_id: sessionId,
        discord_id: discord_id || null,
        identifier: identifier,
        status: 'link_generated',
        platoboost_url: offerUrl,
        ip_address: ipAddress,
        user_agent_hash: userAgentHash,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to save session:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create session'
      }, { status: 500 });
    }

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'platoboost_link_generated',
      severity: 'info',
      message: 'Platoboost offer link generated',
      session_id: sessionId,
      ip_address: ipAddress,
      discord_id: discord_id || null,
      metadata: { identifier: identifier.substring(0, 16) + '...' }
    });

    console.log(`✅ Platoboost link generated for session: ${sessionId.substring(0, 16)}...`);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      offer_url: offerUrl,
      expires_in_hours: 24
    });

  } catch (error: any) {
    console.error('Error generating Platoboost link:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
