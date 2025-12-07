import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET - List all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
    
    if (!isAdmin(discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users with their keys count
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        discord_id,
        discord_username,
        discord_avatar,
        is_banned,
        ban_reason,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get users error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get keys count for each user
    const usersWithKeysCount = await Promise.all(
      (users || []).map(async (user) => {
        const { count } = await supabase
          .from('keys')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        return {
          ...user,
          keys_count: count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      users: usersWithKeysCount,
      total: users?.length || 0
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
