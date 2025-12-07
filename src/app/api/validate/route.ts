import { NextRequest } from 'next/server';
import { supabase, Key, SupportedGame } from '@/lib/supabase';
import { 
  checkRateLimit, 
  generateToken, 
  getClientIP, 
  isValidHwid,
  errorResponse,
  successResponse 
} from '@/lib/utils';

// Token storage (in production, use Redis or database)
const validTokens = new Map<string, { keyId: string; gameId: string; scriptUrl: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, hwid, executor, game_id, place_id, player_name, player_id, game_name } = body;

    // 1. Validate required fields
    if (!key || typeof key !== 'string') {
      return errorResponse('MISSING_KEY', 'Key is required');
    }

    if (!hwid || !isValidHwid(hwid)) {
      return errorResponse('INVALID_HWID', 'Valid HWID is required');
    }

    // 2. Validate place_id (required for multi-game support)
    const placeId = place_id || game_id;
    if (!placeId) {
      return errorResponse('MISSING_PLACE_ID', 'Game PlaceId is required');
    }

    // 3. Rate limiting by HWID
    const rateLimit = checkRateLimit(`hwid:${hwid}`, 10, 60000); // 10 requests per minute
    if (!rateLimit.allowed) {
      return errorResponse(
        'RATE_LIMITED', 
        `Too many requests. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds`,
        429
      );
    }

    const clientIP = getClientIP(request);

    // 4. Check if game is supported
    const { data: gameData, error: gameError } = await supabase
      .from('supported_games')
      .select('*')
      .eq('place_id', placeId)
      .eq('is_active', true)
      .single();

    if (gameError || !gameData) {
      // Log attempt for unsupported game
      await supabase.from('usage_logs').insert({
        hwid,
        executor,
        game_id: placeId,
        game_name: game_name || 'Unknown',
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'GAME_NOT_SUPPORTED'
      });

      return errorResponse(
        'GAME_NOT_SUPPORTED', 
        `This game is not supported. PlaceId: ${placeId}`,
        400
      );
    }

    const supportedGame = gameData as SupportedGame;

    // 5. Check if HWID is blacklisted
    const { data: blacklistedHwid } = await supabase
      .from('blacklisted_hwids')
      .select('*')
      .eq('hwid', hwid)
      .single();

    if (blacklistedHwid) {
      // Log the attempt
      await supabase.from('usage_logs').insert({
        hwid,
        executor,
        game_id,
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'HWID_BANNED'
      });

      return errorResponse('HWID_BANNED', 'This device has been banned', 403);
    }

    // 4. Check if IP is blacklisted (optional)
    const { data: blacklistedIP } = await supabase
      .from('blacklisted_ips')
      .select('*')
      .eq('ip_address', clientIP)
      .single();

    if (blacklistedIP) {
      return errorResponse('IP_BANNED', 'Your IP has been banned', 403);
    }

    // 5. Find the key
    const { data: keyData, error: keyError } = await supabase
      .from('keys')
      .select('*, users(*)')
      .eq('key_value', key.toUpperCase().trim())
      .single();

    if (keyError || !keyData) {
      // Log failed attempt
      await supabase.from('usage_logs').insert({
        hwid,
        executor,
        game_id,
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'INVALID_KEY'
      });

      return errorResponse('INVALID_KEY', 'Invalid key. Get one from discord.gg/sixsense', 401);
    }

    const keyRecord = keyData as Key;

    // 6. Check if key is active
    if (!keyRecord.is_active) {
      await supabase.from('usage_logs').insert({
        key_id: keyRecord.id,
        hwid,
        executor,
        game_id,
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'KEY_DEACTIVATED'
      });

      return errorResponse('KEY_DEACTIVATED', 'This key has been deactivated', 401);
    }

    // 7. Check if user is banned
    if (keyRecord.users?.is_banned) {
      await supabase.from('usage_logs').insert({
        key_id: keyRecord.id,
        user_id: keyRecord.user_id,
        hwid,
        executor,
        game_id,
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'USER_BANNED'
      });

      return errorResponse(
        'USER_BANNED', 
        `Your account has been banned. Reason: ${keyRecord.users.ban_reason || 'No reason provided'}`,
        403
      );
    }

    // 8. Check expiry
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      await supabase.from('usage_logs').insert({
        key_id: keyRecord.id,
        user_id: keyRecord.user_id,
        hwid,
        executor,
        game_id,
        player_name,
        player_id,
        ip_address: clientIP,
        success: false,
        error_type: 'KEY_EXPIRED'
      });

      return errorResponse('KEY_EXPIRED', 'Your key has expired', 401);
    }

    // 9. HWID Lock Logic
    if (keyRecord.hwid_locked && keyRecord.hwid) {
      if (keyRecord.hwid !== hwid) {
        await supabase.from('usage_logs').insert({
          key_id: keyRecord.id,
          user_id: keyRecord.user_id,
          hwid,
          executor,
          game_id,
          player_name,
          player_id,
          ip_address: clientIP,
          success: false,
          error_type: 'HWID_MISMATCH'
        });

        return errorResponse(
          'HWID_MISMATCH', 
          'This key is bound to another device. Contact support for HWID reset.',
          403
        );
      }
    }

    // 10. Bind HWID if first use
    if (!keyRecord.hwid) {
      await supabase
        .from('keys')
        .update({ 
          hwid: hwid, 
          hwid_locked: true,
          hwid_locked_at: new Date().toISOString()
        })
        .eq('id', keyRecord.id);
    }

    // 11. Update key usage stats
    await supabase
      .from('keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        last_used_ip: clientIP,
        last_executor: executor || 'Unknown',
        total_uses: (keyRecord.total_uses || 0) + 1
      })
      .eq('id', keyRecord.id);

    // 12. Log successful usage
    await supabase.from('usage_logs').insert({
      key_id: keyRecord.id,
      user_id: keyRecord.user_id,
      hwid,
      executor,
      game_id: placeId,
      game_name: supportedGame.game_name,
      player_name,
      player_id,
      ip_address: clientIP,
      success: true
    });

    // 13. Update game execution count
    await supabase
      .from('supported_games')
      .update({ total_executions: supportedGame.total_executions + 1 })
      .eq('id', supportedGame.id);

    // 14. Generate script token (valid for 5 minutes)
    const token = generateToken();
    validTokens.set(token, { 
      keyId: keyRecord.id,
      gameId: supportedGame.id,
      scriptUrl: supportedGame.script_url,
      expires: Date.now() + 5 * 60 * 1000 
    });

    // Cleanup expired tokens
    for (const [t, data] of validTokens.entries()) {
      if (Date.now() > data.expires) {
        validTokens.delete(t);
      }
    }

    // 15. Return success with game info
    return successResponse({
      user: keyRecord.users?.discord_username || 'User',
      key_type: keyRecord.key_type,
      expires_at: keyRecord.expires_at,
      total_uses: keyRecord.total_uses + 1,
      script_token: token,
      // Game-specific info
      game: {
        name: supportedGame.game_name,
        version: supportedGame.script_version,
        script_url: supportedGame.script_url
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    return errorResponse('SERVER_ERROR', 'An unexpected error occurred', 500);
  }
}

// Export token validator for script route
export function validateToken(token: string): { keyId: string; gameId: string; scriptUrl: string } | null {
  const data = validTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.expires) {
    validTokens.delete(token);
    return null;
  }
  validTokens.delete(token); // One-time use
  return { keyId: data.keyId, gameId: data.gameId, scriptUrl: data.scriptUrl };
}
