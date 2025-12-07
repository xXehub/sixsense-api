import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id && !session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discordId = session.user.id || session.user.discordId;

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (!user) {
      return NextResponse.json({ 
        keys: [], 
        stats: {
          total_keys: 0,
          active_keys: 0,
          premium_keys: 0,
          linked_hwids: 0
        }
      });
    }

    // Get all keys for this user (by user_id)
    // Based on actual schema: key_value, key_type, hwid, expires_at, etc.
    const { data: keys, error: keysError } = await supabase
      .from('keys')
      .select(`
        id,
        key_value,
        hwid,
        hwid_locked,
        key_type,
        expires_at,
        created_at,
        last_used_at,
        is_active,
        total_uses
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (keysError) {
      console.error('Error fetching keys:', keysError);
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    // Transform keys data to match frontend expectations
    const transformedKeys = (keys || []).map((key: any) => {
      const isPremium = key.key_type === 'lifetime';
      return {
        id: key.id,
        key: key.key_value,
        hwid: key.hwid,
        is_premium: isPremium,
        expires_at: key.expires_at,
        created_at: key.created_at,
        last_used: key.last_used_at,
        is_active: key.is_active,
        total_uses: key.total_uses,
        key_type: key.key_type,
        game: null // No game_id in current schema
      };
    });

    // Calculate stats
    const now = new Date();
    const stats = {
      total_keys: transformedKeys.length,
      active_keys: transformedKeys.filter((k: any) => 
        k.is_active && (!k.expires_at || new Date(k.expires_at) > now)
      ).length,
      premium_keys: transformedKeys.filter((k: any) => k.is_premium).length,
      linked_hwids: transformedKeys.filter((k: any) => k.hwid).length
    };

    return NextResponse.json({ 
      keys: transformedKeys,
      stats 
    });

  } catch (error) {
    console.error('Error in /api/user/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
