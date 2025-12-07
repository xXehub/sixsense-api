import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
    
    if (!isAdmin(discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's keys
    const { data: keys } = await supabase
      .from('keys')
      .select('*')
      .eq('user_id', id);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        keys: keys || []
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user (ban/unban)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
    
    if (!isAdmin(discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    // Find user first
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'ban':
        updateData = {
          is_banned: true,
          ban_reason: reason || 'No reason provided',
          banned_at: new Date().toISOString(),
          banned_by: session?.user?.name || discordId || 'Admin'
        };
        break;

      case 'unban':
        updateData = {
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          banned_by: null
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update user error:', updateError);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log admin action
    try {
      await supabase.from('admin_logs').insert({
        admin_discord_id: discordId,
        admin_username: session?.user?.name,
        action: action === 'ban' ? 'ban_user' : 'unban_user',
        target_type: 'user',
        target_id: id,
        details: { user_discord_id: user.discord_id, reason }
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: action === 'ban' ? 'User banned successfully' : 'User unbanned successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
    
    if (!isAdmin(discordId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get user info first for logging
    const { data: user } = await supabase
      .from('users')
      .select('discord_id, discord_username')
      .eq('id', id)
      .single();

    // Delete user's keys first
    await supabase
      .from('keys')
      .delete()
      .eq('user_id', id);

    // Delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log admin action
    try {
      await supabase.from('admin_logs').insert({
        admin_discord_id: discordId,
        admin_username: session?.user?.name,
        action: 'delete_user',
        target_type: 'user',
        target_id: id,
        details: { user_discord_id: user?.discord_id, username: user?.discord_username }
      });
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
