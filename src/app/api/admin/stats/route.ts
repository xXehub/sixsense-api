import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.id || session?.user?.discordId;
    
    if (!isAdmin(discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total keys
    const { count: totalKeys } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true });

    // Get active keys (not expired)
    const { count: activeKeys } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Get premium/lifetime keys
    const { count: premiumKeys } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('key_type', 'lifetime');

    // Get total games
    const { count: totalGames } = await supabase
      .from('supported_games')
      .select('*', { count: 'exact', head: true });

    // Get total executions
    const { data: execData } = await supabase
      .from('supported_games')
      .select('total_executions');
    
    const totalExecutions = execData?.reduce((sum, g) => sum + (g.total_executions || 0), 0) || 0;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalKeys: totalKeys || 0,
      activeKeys: activeKeys || 0,
      premiumKeys: premiumKeys || 0,
      totalGames: totalGames || 0,
      totalExecutions
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
