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

// GET - List blacklisted HWIDs/IPs
export async function GET(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'hwid'; // 'hwid' or 'ip'

    if (type === 'hwid') {
      const { data: hwids, error } = await supabase
        .from('blacklisted_hwids')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;

      return successResponse({ blacklisted_hwids: hwids });
    } else {
      const { data: ips, error } = await supabase
        .from('blacklisted_ips')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;

      return successResponse({ blacklisted_ips: ips });
    }

  } catch (error) {
    console.error('List blacklist error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to list blacklist', 500);
  }
}

// POST - Add to blacklist
export async function POST(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const body = await request.json();
    const { type, value, reason, admin_id, admin_username } = body;

    if (!type || !value) {
      return errorResponse('MISSING_FIELD', 'type and value are required', 400);
    }

    if (type === 'hwid') {
      const { data, error } = await supabase
        .from('blacklisted_hwids')
        .insert({
          hwid: value,
          reason: reason || 'No reason provided',
          added_by: admin_username || admin_id || 'API'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return errorResponse('ALREADY_EXISTS', 'HWID already blacklisted', 400);
        }
        throw error;
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_discord_id: admin_id || 'API',
        admin_username,
        action: 'blacklist_hwid',
        target_type: 'hwid',
        target_id: value,
        details: { reason }
      });

      return successResponse({
        blacklisted: data,
        message: 'HWID blacklisted successfully'
      }, 201);

    } else if (type === 'ip') {
      const { data, error } = await supabase
        .from('blacklisted_ips')
        .insert({
          ip_address: value,
          reason: reason || 'No reason provided',
          added_by: admin_username || admin_id || 'API'
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return errorResponse('ALREADY_EXISTS', 'IP already blacklisted', 400);
        }
        throw error;
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_discord_id: admin_id || 'API',
        admin_username,
        action: 'blacklist_ip',
        target_type: 'ip',
        target_id: value,
        details: { reason }
      });

      return successResponse({
        blacklisted: data,
        message: 'IP blacklisted successfully'
      }, 201);

    } else {
      return errorResponse('INVALID_TYPE', 'type must be "hwid" or "ip"', 400);
    }

  } catch (error) {
    console.error('Blacklist error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to add to blacklist', 500);
  }
}

// DELETE - Remove from blacklist
export async function DELETE(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const value = searchParams.get('value');
    const adminId = searchParams.get('admin_id') || 'API';

    if (!type || !value) {
      return errorResponse('MISSING_FIELD', 'type and value are required', 400);
    }

    if (type === 'hwid') {
      const { error } = await supabase
        .from('blacklisted_hwids')
        .delete()
        .eq('hwid', value);

      if (error) throw error;

    } else if (type === 'ip') {
      const { error } = await supabase
        .from('blacklisted_ips')
        .delete()
        .eq('ip_address', value);

      if (error) throw error;

    } else {
      return errorResponse('INVALID_TYPE', 'type must be "hwid" or "ip"', 400);
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: adminId,
      action: `unblacklist_${type}`,
      target_type: type,
      target_id: value
    });

    return successResponse({
      message: `${type.toUpperCase()} removed from blacklist`
    });

  } catch (error) {
    console.error('Remove blacklist error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to remove from blacklist', 500);
  }
}
