import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Known Roblox executor patterns (same as script endpoint)
const EXECUTOR_PATTERNS = [
  'roblox', 'synapse', 'script-ware', 'scriptware', 'krnl', 
  'fluxus', 'oxygen', 'hydrogen', 'electron', 'evon',
  'httpget', 'syn', 'http_request', 'request'
];

function isExecutorRequest(request: NextRequest): boolean {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const robloxSecurity = request.headers.get('roblox-security');
  const synHeader = request.headers.get('syn-fingerprint');
  
  if (synHeader || robloxSecurity) return true;
  
  for (const pattern of EXECUTOR_PATTERNS) {
    if (userAgent.includes(pattern)) return true;
  }
  
  return !userAgent || userAgent.length < 5;
}

// GET /api/validate/key - Validate license key for runtime checking
export async function GET(request: NextRequest) {
  try {
    // 1. REMOVED: Allow all requests (game client, executor, etc)
    // Validation endpoint harus accessible dari game:HttpGet() di Roblox
    // yang user-agent nya bisa berbeda dari executor
    
    // 2. Get parameters
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const scriptAccessKey = searchParams.get('script');

    if (!key) {
      return NextResponse.json({
        valid: false,
        error: 'MISSING_KEY',
        message: 'License key required'
      });
    }

    // 3. Validate the key
    const { data: keyData, error: keyError } = await supabase
      .from('keys')
      .select('*, users(discord_username)')
      .eq('key_value', key)
      .eq('is_active', true)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({
        valid: false,
        error: 'INVALID_KEY',
        message: 'Invalid or inactive license key'
      });
    }

    // 4. Check key expiry
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'KEY_EXPIRED',
        message: 'License key has expired'
      });
    }

    // 5. Check if user is banned
    if (keyData.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', keyData.user_id)
        .single();

      if (userData?.is_banned) {
        return NextResponse.json({
          valid: false,
          error: 'USER_BANNED',
          message: 'User account has been banned'
        });
      }
    }

    // 6. Update key usage stats (optional - don't fail if this errors)
    try {
      await supabase
        .from('keys')
        .update({
          last_used_at: new Date().toISOString(),
          last_used_ip: request.headers.get('x-forwarded-for') || 'unknown',
          total_uses: (keyData.total_uses || 0) + 1
        })
        .eq('id', keyData.id);
    } catch (err) {
      console.error('Failed to update key stats:', err);
    }

    // 7. Return validation success
    return NextResponse.json({
      valid: true,
      username: keyData.users?.discord_username || 'User',
      key_type: keyData.key_type,
      expires_at: keyData.expires_at
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });

  } catch (error) {
    console.error('Key validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'SERVER_ERROR',
      message: 'Failed to validate key'
    }, { status: 500 });
  }
}
