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
 * POST /api/platoboost/verify-key
 * 
 * Verifies key with Platoboost API and issues game key
 * 
 * Body: { session_id: string, key: string }
 * Returns: { success: true, game_key: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, key } = body;

    if (!session_id || !key) {
      return NextResponse.json({
        success: false,
        error: 'session_id and key are required'
      }, { status: 400 });
    }

    const serviceId = process.env.PLATOBOOST_SERVICE_ID;
    const secretKey = process.env.PLATOBOOST_SECRET_KEY;
    const baseUrl = process.env.PLATOBOOST_BASE_URL || 'https://api.platoboost.com';

    if (!serviceId || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'Platoboost not configured'
      }, { status: 500 });
    }

    const ipAddress = getRealIP(request);

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('platoboost_sessions')
      .select('*')
      .eq('session_id', session_id)
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
        error: 'Session expired. Please get a new link.'
      }, { status: 410 });
    }

    // Check if already verified
    if (session.status === 'verified' || session.status === 'redeemed') {
      if (session.issued_key_id) {
        const { data: existingKey } = await supabase
          .from('issued_keys')
          .select('key_value')
          .eq('id', session.issued_key_id)
          .single();

        if (existingKey) {
          return NextResponse.json({
            success: true,
            game_key: existingKey.key_value,
            message: 'Key already issued'
          });
        }
      }
    }

    const identifier = session.identifier;

    // Step 1: Check whitelist first
    console.log('🔍 Checking whitelist for identifier:', identifier.substring(0, 16) + '...');

    const whitelistUrl = `${baseUrl}/public/whitelist/${serviceId}?identifier=${identifier}&key=${encodeURIComponent(key)}`;
    const whitelistResponse = await fetch(whitelistUrl, { method: 'GET' });
    const whitelistData = await whitelistResponse.json();

    // Log whitelist check
    await supabase.from('platoboost_api_log').insert({
      session_id: session_id,
      endpoint: '/public/whitelist',
      method: 'GET',
      request_body: { identifier: identifier.substring(0, 16) + '...', key: key.substring(0, 8) + '...' },
      response_status: whitelistResponse.status,
      response_body: whitelistData,
      success: whitelistResponse.ok
    });

    let isValid = false;

    // Check if whitelisted
    if (whitelistResponse.ok && whitelistData.data?.valid === true) {
      console.log('✅ User already whitelisted');
      isValid = true;
    } 
    // Step 2: If not whitelisted and key starts with "KEY_", try redeem
    else if (key.startsWith('KEY_')) {
      console.log('🎟️ Attempting to redeem key:', key.substring(0, 12) + '...');

      const redeemResponse = await fetch(`${baseUrl}/public/redeem/${serviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier,
          key: key
        })
      });

      const redeemData = await redeemResponse.json();

      // Log redeem attempt
      await supabase.from('platoboost_api_log').insert({
        session_id: session_id,
        endpoint: '/public/redeem',
        method: 'POST',
        request_body: { identifier: identifier.substring(0, 16) + '...', key: key.substring(0, 8) + '...' },
        response_status: redeemResponse.status,
        response_body: redeemData,
        success: redeemResponse.ok,
        error_message: redeemResponse.ok ? null : redeemData.message
      });

      if (redeemResponse.ok && redeemData.data?.valid === true) {
        console.log('✅ Key redeemed successfully');
        isValid = true;
      } else {
        console.error('❌ Key redeem failed:', redeemData.message || 'Unknown error');
        return NextResponse.json({
          success: false,
          error: redeemData.message || 'Invalid or already used key'
        }, { status: 400 });
      }
    } else {
      console.error('❌ Whitelist check failed and key is not redeemable');
      return NextResponse.json({
        success: false,
        error: whitelistData.message || 'Key not valid. Please complete the offers first.'
      }, { status: 400 });
    }

    // If we reach here, verification succeeded!
    // Generate game key
    const gameKey = `SIXSENSE-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
    const keyExpiresAt = new Date();
    keyExpiresAt.setHours(keyExpiresAt.getHours() + 24); // 24 hour key

    // Store game key
    const { data: issuedKey, error: keyError } = await supabase
      .from('issued_keys')
      .insert({
        key_value: gameKey,
        key_type: 'daily',
        discord_id: session.discord_id,
        session_id: session_id,
        is_active: true,
        expires_at: keyExpiresAt.toISOString(),
        source: 'platoboost',
        ip_address: ipAddress
      })
      .select('id')
      .single();

    if (keyError || !issuedKey) {
      console.error('Failed to store game key:', keyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate game key'
      }, { status: 500 });
    }

    // Update session
    await supabase
      .from('platoboost_sessions')
      .update({
        status: key.startsWith('KEY_') ? 'redeemed' : 'verified',
        submitted_key: key,
        issued_key_id: issuedKey.id,
        verified_at: new Date().toISOString()
      })
      .eq('session_id', session_id);

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'platoboost_key_verified',
      severity: 'info',
      message: 'Platoboost key verified and game key issued',
      session_id: session_id,
      ip_address: ipAddress,
      discord_id: session.discord_id,
      metadata: { 
        platoboost_key: key.substring(0, 12) + '...',
        method: key.startsWith('KEY_') ? 'redeem' : 'whitelist'
      }
    });

    console.log(`✅ Game key issued: ${gameKey.substring(0, 20)}... for session ${session_id.substring(0, 16)}...`);

    return NextResponse.json({
      success: true,
      game_key: gameKey,
      expires_at: keyExpiresAt.toISOString()
    });

  } catch (error: any) {
    console.error('Error verifying Platoboost key:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
