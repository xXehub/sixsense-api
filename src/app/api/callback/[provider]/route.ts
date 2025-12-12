import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Work.ink Token Validation & Callback Handler
 * 
 * Work.ink Flow:
 * 1. User completes offer → Gets token
 * 2. User submits token to our system
 * 3. We validate token with Work.ink API
 * 4. Generate key if valid
 * 
 * Work.ink API: GET https://work.ink/_api/v2/token/isValid/{TOKEN}
 * Response: { valid: true, info: { token, createdAt, byIp, linkId, expiresAfter } }
 */

// Validate Work.ink token
async function validateWorkinkToken(token: string): Promise<{
  valid: boolean;
  info?: {
    token: string;
    createdAt: number;
    byIp: string;
    linkId: number;
    expiresAfter: number;
  };
}> {
  try {
    const response = await fetch(`https://work.ink/_api/v2/token/isValid/${token}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Work.ink token validation error:', error);
    return { valid: false };
  }
}

// Verify IP address (SHA-256 if enabled)
function verifyIpAddress(
  sessionIp: string, 
  tokenIp: string, 
  useSha256: boolean = false
): boolean {
  if (useSha256) {
    // Hash session IP and compare
    const hashedSessionIp = crypto.createHash('sha256').update(sessionIp).digest('hex');
    return hashedSessionIp === tokenIp;
  }
  return sessionIp === tokenIp;
}

// Helper to generate key
async function generateKey(duration: number, discordId: string, provider: string): Promise<string> {
  const keyType = duration <= 1 ? 'daily' : duration <= 7 ? 'weekly' : 'monthly';
  
  try {
    // Call key generation API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discord_id: discordId,
        key_type: keyType,
        duration_days: duration,
        source: `provider_${provider}`,
        auto_generated: true
      })
    });

    const data = await response.json();
    if (data.success && data.key) {
      return data.key;
    }
    
    throw new Error(data.error || 'Failed to generate key');
  } catch (error) {
    console.error('Key generation error:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    
    const sessionId = searchParams.get('session') || searchParams.get('sr');
    const workinkToken = searchParams.get('token');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('provider_completions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (session.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Session already completed',
        key: session.key
      });
    }

    // Check if session expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 400 }
      );
    }

    // Get provider config
    const { data: providerData, error: providerError } = await supabase
      .from('key_providers')
      .select('*')
      .eq('provider_id', provider)
      .single();

    if (providerError || !providerData) {
      console.error('Provider lookup error (GET /callback):', {
        provider,
        sessionId,
        error: providerError?.message
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider not found',
          details: {
            provider,
            message: 'Provider not configured in database',
            hint: 'Check admin panel or run database/check-providers.sql'
          }
        },
        { status: 404 }
      );
    }

    // For Work.ink: Validate token if provided
    if (provider === 'workink' && workinkToken) {
      const validation = await validateWorkinkToken(workinkToken);
      
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid Work.ink token' },
          { status: 400 }
        );
      }

      // Verify IP address if required
      if (providerData.require_ip_check && validation.info) {
        const ipMatch = verifyIpAddress(
          session.ip_address || '',
          validation.info.byIp,
          providerData.use_sha256_ip || false
        );

        if (!ipMatch) {
          return NextResponse.json(
            { success: false, error: 'IP address mismatch. Possible bypass attempt.' },
            { status: 403 }
          );
        }
      }

      // Store Work.ink token info
      await supabase
        .from('provider_completions')
        .update({
          workink_token: workinkToken,
          token_created_at: validation.info?.createdAt,
          token_expires_at: validation.info?.expiresAfter,
          token_link_id: validation.info?.linkId?.toString()
        })
        .eq('session_id', sessionId);
    }

    // Generate key
    const key = await generateKey(
      providerData.key_duration_days || 1, 
      session.discord_id, 
      provider
    );

    // Update session as completed
    const { error: updateError } = await supabase
      .from('provider_completions')
      .update({
        status: 'completed',
        verified: true,
        verified_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        key: key,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) throw updateError;

    // Update provider stats
    await supabase.rpc('increment_provider_completions', {
      p_provider_id: provider
    });

    return NextResponse.json({
      success: true,
      message: 'Offer completed successfully',
      key: key
    });
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const body = await request.json();
    
    const sessionId = body.session || body.sr || body.session_id;
    const workinkToken = body.token || body.workink_token;
    const userId = body.user_id || body.discord_id;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get session from database
    const { data: session, error: sessionError } = await supabase
      .from('provider_completions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (session.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Session already completed',
        key: session.key
      });
    }

    // Check if session expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 400 }
      );
    }

    // Verify user ID matches (if provided)
    if (userId && session.discord_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 401 }
      );
    }

    // Get provider config
    const { data: providerData, error: providerError } = await supabase
      .from('key_providers')
      .select('*')
      .eq('provider_id', provider)
      .single();

    if (providerError || !providerData) {
      console.error('Provider lookup error (POST /callback):', {
        provider,
        sessionId,
        error: providerError?.message
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider not found',
          details: {
            provider,
            message: 'Provider not configured in database',
            hint: 'Check admin panel or run database/check-providers.sql'
          }
        },
        { status: 404 }
      );
    }

    // For Work.ink: Validate token if provided
    if (provider === 'workink' && workinkToken) {
      const validation = await validateWorkinkToken(workinkToken);
      
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid Work.ink token' },
          { status: 400 }
        );
      }

      // Verify IP address if required
      if (providerData.require_ip_check && validation.info) {
        const ipMatch = verifyIpAddress(
          session.ip_address || '',
          validation.info.byIp,
          providerData.use_sha256_ip || false
        );

        if (!ipMatch) {
          return NextResponse.json(
            { success: false, error: 'IP address mismatch. Possible bypass attempt.' },
            { status: 403 }
          );
        }
      }

      // Store Work.ink token info
      await supabase
        .from('provider_completions')
        .update({
          workink_token: workinkToken,
          token_created_at: validation.info?.createdAt,
          token_expires_at: validation.info?.expiresAfter,
          token_link_id: validation.info?.linkId?.toString()
        })
        .eq('session_id', sessionId);
    }

    // Generate key
    const key = await generateKey(
      providerData.key_duration_days || 1,
      session.discord_id,
      provider
    );

    // Update session as completed
    const { error: updateError } = await supabase
      .from('provider_completions')
      .update({
        status: 'completed',
        verified: true,
        verified_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        key: key,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) throw updateError;

    // Update provider stats
    await supabase.rpc('increment_provider_completions', {
      p_provider_id: provider
    });

    return NextResponse.json({
      success: true,
      message: 'Offer completed successfully',
      key: key
    });
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
