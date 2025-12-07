import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';

// Public stats endpoint (no auth required)
export async function GET(request: NextRequest) {
  try {
    // Get total keys count
    const { count: totalKeys } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true });

    // Get active keys count
    const { count: activeKeys } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total script executions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: executionsToday } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('success', true)
      .gte('timestamp', oneDayAgo);

    // Get total executions all time
    const { count: totalExecutions } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('success', true);

    return successResponse({
      stats: {
        total_keys: totalKeys || 0,
        active_keys: activeKeys || 0,
        total_users: totalUsers || 0,
        executions_24h: executionsToday || 0,
        total_executions: totalExecutions || 0
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to fetch stats', 500);
  }
}
