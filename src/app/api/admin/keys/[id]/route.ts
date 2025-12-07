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

// GET - Get single key details
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

    const { data: key, error } = await supabase
      .from('keys')
      .select('*, users(*)')
      .eq('id', id)
      .single();

    if (error || !key) {
      return errorResponse('NOT_FOUND', 'Key not found', 404);
    }

    // Get usage stats
    const { count: usageCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('key_id', id);

    return successResponse({
      key,
      usage_count: usageCount || 0
    });

  } catch (error) {
    console.error('Get key error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get key', 500);
  }
}

// PATCH - Update key (reset HWID, deactivate, etc.)
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
    const { action } = body;

    // Find the key first
    const { data: existingKey, error: findError } = await supabase
      .from('keys')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existingKey) {
      return errorResponse('NOT_FOUND', 'Key not found', 404);
    }

    let updateData: Record<string, unknown> = {};
    let logAction = action;

    switch (action) {
      case 'reset_hwid':
      case 'reset-hwid':
        if (existingKey.hwid_resets_used >= existingKey.max_hwid_resets) {
          return errorResponse('MAX_RESETS', 'Maximum HWID resets reached', 400);
        }
        updateData = {
          hwid: null,
          hwid_locked: false,
          hwid_locked_at: null,
          hwid_resets_used: existingKey.hwid_resets_used + 1,
          last_hwid_reset: new Date().toISOString()
        };
        logAction = 'reset_hwid';
        break;

      case 'toggle':
        // Toggle active status
        updateData = existingKey.is_active 
          ? {
              is_active: false,
              deactivated_at: new Date().toISOString(),
              deactivated_reason: 'Deactivated by admin'
            }
          : {
              is_active: true,
              deactivated_at: null,
              deactivated_reason: null
            };
        logAction = existingKey.is_active ? 'deactivate' : 'activate';
        break;

      case 'deactivate':
        updateData = {
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivated_reason: body.reason || 'Deactivated by admin'
        };
        break;

      case 'activate':
        updateData = {
          is_active: true,
          deactivated_at: null,
          deactivated_reason: null
        };
        break;

      case 'add_hwid_reset':
        updateData = {
          max_hwid_resets: existingKey.max_hwid_resets + 1
        };
        logAction = 'add_hwid_reset';
        break;

      default:
        return errorResponse('INVALID_ACTION', 'Invalid action specified', 400);
    }

    // Update the key
    const { data: updatedKey, error: updateError } = await supabase
      .from('keys')
      .update(updateData)
      .eq('id', id)
      .select('*, users(*)')
      .single();

    if (updateError) throw updateError;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: auth.discordId || 'API',
      admin_username: auth.username,
      action: logAction,
      target_type: 'key',
      target_id: id,
      details: { previous: existingKey, updated: updateData }
    });

    return successResponse({
      key: updatedKey,
      message: `Key ${action} successful`
    });

  } catch (error) {
    console.error('Update key error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update key', 500);
  }
}

// DELETE - Delete key
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

    const { error } = await supabase
      .from('keys')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: auth.discordId || 'API',
      admin_username: auth.username,
      action: 'delete_key',
      target_type: 'key',
      target_id: id
    });

    return successResponse({
      message: 'Key deleted successfully'
    });

  } catch (error) {
    console.error('Delete key error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to delete key', 500);
  }
}
