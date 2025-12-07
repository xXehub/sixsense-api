import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';

// Simple API key auth for admin endpoints
function validateAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const apiKey = authHeader.replace('Bearer ', '');
  return apiKey === process.env.API_SECRET_KEY;
}

// POST - Ban user by Discord ID
export async function POST(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const body = await request.json();
    const { discord_id, reason, admin_id, admin_username } = body;

    if (!discord_id) {
      return errorResponse('MISSING_FIELD', 'discord_id is required', 400);
    }

    // Find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discord_id)
      .single();

    if (findError || !user) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // Ban the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_banned: true,
        ban_reason: reason || 'No reason provided',
        banned_at: new Date().toISOString(),
        banned_by: admin_username || admin_id || 'API'
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: admin_id || 'API',
      admin_username,
      action: 'ban_user',
      target_type: 'user',
      target_id: user.id,
      details: { discord_id, reason }
    });

    return successResponse({
      user: updatedUser,
      message: 'User banned successfully'
    });

  } catch (error) {
    console.error('Ban user error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to ban user', 500);
  }
}

// DELETE - Unban user
export async function DELETE(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const discordId = searchParams.get('discord_id');
    const adminId = searchParams.get('admin_id') || 'API';

    if (!discordId) {
      return errorResponse('MISSING_FIELD', 'discord_id is required', 400);
    }

    // Find and unban the user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        is_banned: false,
        ban_reason: null,
        banned_at: null,
        banned_by: null
      })
      .eq('discord_id', discordId)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: adminId,
      action: 'unban_user',
      target_type: 'user',
      target_id: updatedUser.id,
      details: { discord_id: discordId }
    });

    return successResponse({
      user: updatedUser,
      message: 'User unbanned successfully'
    });

  } catch (error) {
    console.error('Unban user error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to unban user', 500);
  }
}
