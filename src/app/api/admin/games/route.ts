import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';

// Support both API key auth and session auth
async function validateAuth(request: NextRequest): Promise<{ valid: boolean; discordId?: string; username?: string }> {
  // Check API key first (for external/bot access)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey === process.env.API_SECRET_KEY) {
      return { valid: true, discordId: 'API', username: 'API' };
    }
  }
  
  // Check session auth (for web panel)
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
  
  if (isAdmin(discordId)) {
    return { valid: true, discordId, username: session?.user?.name || undefined };
  }
  
  return { valid: false };
}

// GET /api/admin/games - List all supported games
export async function GET(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('supported_games')
      .select('*')
      .order('game_name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    return successResponse({
      games: data,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('List games error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to list games', 500);
  }
}

// POST /api/admin/games - Add a new supported game
export async function POST(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { place_id, game_name, script_url, description, min_key_tier, created_by } = body;

    // Validate required fields
    if (!place_id || !game_name || !script_url) {
      return errorResponse('MISSING_FIELDS', 'place_id, game_name, and script_url are required');
    }

    // Check if game already exists
    const { data: existing } = await supabase
      .from('supported_games')
      .select('id')
      .eq('place_id', place_id)
      .single();

    if (existing) {
      return errorResponse('GAME_EXISTS', `Game with PlaceId ${place_id} already exists`);
    }

    // Insert new game
    const { data, error } = await supabase
      .from('supported_games')
      .insert({
        place_id: Number(place_id),
        game_name,
        script_url,
        description: description || null,
        min_key_tier: min_key_tier || 'basic',
        created_by: created_by || 'API'
      })
      .select()
      .single();

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    return successResponse({
      message: 'Game added successfully',
      game: data
    });
  } catch (error) {
    console.error('Add game error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to add game', 500);
  }
}

// DELETE /api/admin/games - Remove a supported game
export async function DELETE(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return errorResponse('MISSING_PLACE_ID', 'place_id query parameter is required');
    }

    const { data, error } = await supabase
      .from('supported_games')
      .delete()
      .eq('place_id', Number(placeId))
      .select()
      .single();

    if (error || !data) {
      return errorResponse('GAME_NOT_FOUND', `Game with PlaceId ${placeId} not found`);
    }

    return successResponse({
      message: 'Game removed successfully',
      game: data
    });
  } catch (error) {
    console.error('Delete game error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to delete game', 500);
  }
}

// PATCH /api/admin/games - Update a supported game
export async function PATCH(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { place_id, ...updates } = body;

    if (!place_id) {
      return errorResponse('MISSING_PLACE_ID', 'place_id is required');
    }

    // Only allow certain fields to be updated
    const allowedFields = ['game_name', 'script_url', 'script_version', 'description', 'min_key_tier', 'is_active', 'thumbnail_url'];
    const filteredUpdates: Record<string, unknown> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return errorResponse('NO_UPDATES', 'No valid fields to update');
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('supported_games')
      .update(filteredUpdates)
      .eq('place_id', Number(place_id))
      .select()
      .single();

    if (error || !data) {
      return errorResponse('GAME_NOT_FOUND', `Game with PlaceId ${place_id} not found`);
    }

    return successResponse({
      message: 'Game updated successfully',
      game: data
    });
  } catch (error) {
    console.error('Update game error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update game', 500);
  }
}
