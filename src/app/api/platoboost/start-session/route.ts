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
 * POST /api/platoboost/start-session
 * 
 * Creates a session and returns Platoboost URL with subid
 * 
 * Body: { provider: 'lootlabs' | 'linkvertise' | 'workink', discord_id?: string }
 * Returns: { success: true, session_id: string, platoboost_url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, discord_id } = body;

    // Validate provider
    if (!provider || !['lootlabs', 'linkvertise', 'workink'].includes(provider)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid provider. Choose: lootlabs, linkvertise, or workink'
      }, { status: 400 });
    }

    const ipAddress = getRealIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const userAgentHash = hashUserAgent(userAgent);

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Get Platoboost link slug from env
    const slugMap: Record<string, string> = {
      lootlabs: process.env.PLATOBOOST_LOOTLABS_SLUG || '',
      linkvertise: process.env.PLATOBOOST_LINKVERTISE_SLUG || '',
      workink: process.env.PLATOBOOST_WORKINK_SLUG || ''
    };

    const linkSlug = slugMap[provider];
    if (!linkSlug) {
      return NextResponse.json({
        success: false,
        error: `${provider} not configured. Please add PLATOBOOST_${provider.toUpperCase()}_SLUG to .env`
      }, { status: 500 });
    }

    // Create session in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

    const { error: insertError } = await supabase
      .from('platoboost_sessions')
      .insert({
        session_id: sessionId,
        discord_id: discord_id || null,
        provider: provider,
        status: 'pending',
        ip_address: ipAddress,
        user_agent_hash: userAgentHash,
        platoboost_link_slug: linkSlug,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to create session:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create session'
      }, { status: 500 });
    }

    // Build Platoboost URL with subid
    const platoboostUrl = `https://gateway.platoboost.com/a/${linkSlug}?id=${sessionId}`;

    // Log security event
    await supabase.from('security_events').insert({
      event_type: 'platoboost_session_created',
      severity: 'info',
      message: `Platoboost session created for ${provider}`,
      session_id: sessionId,
      ip_address: ipAddress,
      discord_id: discord_id || null,
      metadata: { provider, link_slug: linkSlug }
    });

    console.log(`✅ Platoboost session created: ${sessionId.substring(0, 16)}... (${provider})`);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      platoboost_url: platoboostUrl,
      provider: provider,
      expires_in_minutes: 15
    });

  } catch (error: any) {
    console.error('Error creating Platoboost session:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
