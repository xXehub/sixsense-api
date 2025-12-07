import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';

// GET /api/games - List supported games (public)
// GET /api/games?place_id=123 - Check if specific game is supported
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    // If place_id provided, check specific game
    if (placeId) {
      const { data, error } = await supabase
        .from('supported_games')
        .select('place_id, game_name, script_version, description, is_active')
        .eq('place_id', Number(placeId))
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return successResponse({
          supported: false,
          place_id: Number(placeId),
          message: 'This game is not supported'
        });
      }

      return successResponse({
        supported: true,
        game: {
          place_id: data.place_id,
          name: data.game_name,
          version: data.script_version,
          description: data.description
        }
      });
    }

    // List all supported games (public info only)
    const { data, error } = await supabase
      .from('supported_games')
      .select('place_id, game_name, script_version, description, total_executions')
      .eq('is_active', true)
      .order('game_name', { ascending: true });

    if (error) {
      return errorResponse('DATABASE_ERROR', 'Failed to fetch games', 500);
    }

    return successResponse({
      games: data?.map(g => ({
        place_id: g.place_id,
        name: g.game_name,
        version: g.script_version,
        description: g.description,
        executions: g.total_executions
      })) || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('Games API error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to process request', 500);
  }
}
