import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

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

// GET - Get single game details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    const { data: game, error } = await supabase
      .from('supported_games')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      game
    });

  } catch (error) {
    console.error('Get game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update game (toggle active, update info)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, game_name, script_url, description, min_key_tier } = body;

    // Find game first
    const { data: game, error: findError } = await supabase
      .from('supported_games')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    if (action === 'toggle') {
      // Toggle active status
      updateData = {
        is_active: !game.is_active,
        updated_at: new Date().toISOString()
      };
    } else {
      // Update game info
      if (game_name) updateData.game_name = game_name;
      if (script_url) updateData.script_url = script_url;
      if (description !== undefined) updateData.description = description;
      if (min_key_tier) updateData.min_key_tier = min_key_tier;
      updateData.updated_at = new Date().toISOString();
    }

    const { data: updatedGame, error: updateError } = await supabase
      .from('supported_games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update game error:', updateError);
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
    }

    // Log admin action
    try {
      await supabase.from('admin_logs').insert({
        admin_discord_id: auth.discordId,
        admin_username: auth.username,
        action: action === 'toggle' ? 'toggle_game' : 'update_game',
        target_type: 'game',
        target_id: id,
        details: { previous: game, updated: updateData }
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      game: updatedGame,
      message: action === 'toggle' 
        ? `Game ${updatedGame.is_active ? 'activated' : 'deactivated'} successfully`
        : 'Game updated successfully'
    });

  } catch (error) {
    console.error('Update game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Get game info first for logging
    const { data: game } = await supabase
      .from('supported_games')
      .select('game_name, place_id')
      .eq('id', id)
      .single();

    // Delete the game
    const { error } = await supabase
      .from('supported_games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete game error:', error);
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
    }

    // Log admin action
    try {
      await supabase.from('admin_logs').insert({
        admin_discord_id: auth.discordId,
        admin_username: auth.username,
        action: 'delete_game',
        target_type: 'game',
        target_id: id,
        details: { game_name: game?.game_name, place_id: game?.place_id }
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
