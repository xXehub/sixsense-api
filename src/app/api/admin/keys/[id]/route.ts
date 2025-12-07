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

// GET - Get single key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
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
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, admin_id } = body;

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
      admin_discord_id: admin_id || 'API',
      admin_username: body.admin_username,
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
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id') || 'API';

    const { error } = await supabase
      .from('keys')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: adminId,
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
