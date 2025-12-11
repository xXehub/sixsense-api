import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';

interface ScriptParams {
  params: Promise<{
    id: string;
  }>;
}

// Support both API key auth and session auth
async function validateAuth(request: NextRequest): Promise<{ valid: boolean; discordId?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey === process.env.API_SECRET_KEY) {
      return { valid: true, discordId: 'API' };
    }
  }
  
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
  
  if (isAdmin(discordId)) {
    return { valid: true, discordId };
  }
  
  return { valid: false };
}

// GET /api/admin/scripts/[id] - Get single script with content
export async function GET(request: NextRequest, { params }: ScriptParams) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('protected_scripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return errorResponse('NOT_FOUND', 'Script not found', 404);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev';

    return successResponse({
      script: {
        ...data,
        loadstring_url: `${baseUrl}/api/script/${data.access_key}`,
        loadstring_code: `loadstring(game:HttpGet("${baseUrl}/api/script/${data.access_key}"))()`,
      }
    });
  } catch (error) {
    console.error('Get script error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get script', 500);
  }
}

// PATCH /api/admin/scripts/[id] - Update script
export async function PATCH(request: NextRequest, { params }: ScriptParams) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      version, 
      script_content, 
      require_key, 
      require_hwid,
      allowed_games,
      allowed_executors,
      max_requests_per_minute,
      is_active
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (version !== undefined) updateData.version = version;
    if (script_content !== undefined) updateData.script_content = script_content;
    if (require_key !== undefined) updateData.require_key = require_key;
    if (require_hwid !== undefined) updateData.require_hwid = require_hwid;
    if (allowed_games !== undefined) updateData.allowed_games = allowed_games;
    if (allowed_executors !== undefined) updateData.allowed_executors = allowed_executors;
    if (max_requests_per_minute !== undefined) updateData.max_requests_per_minute = max_requests_per_minute;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('protected_scripts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    return successResponse({
      script: data,
      message: 'Script updated successfully'
    });
  } catch (error) {
    console.error('Update script error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to update script', 500);
  }
}

// DELETE /api/admin/scripts/[id] - Delete script
export async function DELETE(request: NextRequest, { params }: ScriptParams) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { error } = await supabase
      .from('protected_scripts')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    return successResponse({
      message: 'Script deleted successfully'
    });
  } catch (error) {
    console.error('Delete script error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to delete script', 500);
  }
}
