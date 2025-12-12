import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * GET /api/platoboost/check-session?session_id=xxx
 * 
 * Frontend polls this to check if offer completed and key ready
 * 
 * Returns:
 * - { success: false, pending: true } - still waiting
 * - { success: true, key: 'XXX-XXX-XXX' } - key ready!
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'session_id is required'
      }, { status: 400 });
    }

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('platoboost_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Session expired. Please start again.'
      }, { status: 410 });
    }

    // If key already issued, return it
    if (session.status === 'key_issued' && session.issued_key_id) {
      const { data: keyData } = await supabase
        .from('issued_keys')
        .select('key_value')
        .eq('id', session.issued_key_id)
        .single();

      if (keyData) {
        return NextResponse.json({
          success: true,
          key: keyData.key_value,
          status: 'completed',
          provider: session.provider
        });
      }
    }

    // If completed but no key yet, issue key now
    if (session.status === 'completed') {
      // Generate key
      const key = `SIXSENSE-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour key

      // Store key
      const { data: keyData, error: keyError } = await supabase
        .from('issued_keys')
        .insert({
          key_value: key,
          key_type: 'daily',
          discord_id: session.discord_id,
          session_id: sessionId,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          source: 'platoboost',
          ip_address: session.ip_address
        })
        .select('id')
        .single();

      if (keyError || !keyData) {
        console.error('Failed to create key:', keyError);
        return NextResponse.json({
          success: false,
          error: 'Failed to generate key'
        }, { status: 500 });
      }

      // Update session
      await supabase
        .from('platoboost_sessions')
        .update({
          status: 'key_issued',
          issued_key_id: keyData.id
        })
        .eq('session_id', sessionId);

      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'key_issued',
        severity: 'info',
        message: `Key issued for ${session.provider} offer`,
        session_id: sessionId,
        ip_address: session.ip_address,
        discord_id: session.discord_id,
        metadata: { provider: session.provider, key_type: 'daily' }
      });

      console.log(`✅ Key issued: ${key.substring(0, 20)}... for session ${sessionId.substring(0, 16)}...`);

      return NextResponse.json({
        success: true,
        key: key,
        status: 'completed',
        provider: session.provider
      });
    }

    // Still pending
    return NextResponse.json({
      success: false,
      pending: true,
      status: session.status,
      provider: session.provider,
      message: `Waiting for ${session.provider} offer completion...`
    });

  } catch (error: any) {
    console.error('Error checking Platoboost session:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
