import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { errorResponse, successResponse } from '@/lib/utils';
import crypto from 'crypto';

// Generate random access key
function generateAccessKey(): string {
  return crypto.randomBytes(16).toString('hex'); // 32 chars
}

// Support both API key auth and session auth
async function validateAuth(request: NextRequest): Promise<{ valid: boolean; discordId?: string; username?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey === process.env.API_SECRET_KEY) {
      return { valid: true, discordId: 'API', username: 'API' };
    }
  }
  
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
  
  if (isAdmin(discordId)) {
    return { valid: true, discordId, username: session?.user?.name || undefined };
  }
  
  return { valid: false };
}

// GET /api/admin/scripts - List all protected scripts
export async function GET(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('protected_scripts')
      .select('id, name, description, version, access_key, require_key, require_hwid, allowed_games, is_active, total_loads, created_at, updated_at, created_by')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    // Generate loadstring URLs for each script
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev';
    const scriptsWithUrls = data?.map(script => ({
      ...script,
      loadstring_url: `${baseUrl}/api/script/${script.access_key}`,
      loadstring_code: `loadstring(game:HttpGet("${baseUrl}/api/script/${script.access_key}"))()`,
    }));

    return successResponse({
      scripts: scriptsWithUrls,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('List scripts error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to list scripts', 500);
  }
}

// POST /api/admin/scripts - Create a new protected script
export async function POST(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      name, 
      description, 
      version, 
      script_content, 
      require_key = true, 
      require_hwid = false,
      allowed_games,
      allowed_executors,
      max_requests_per_minute = 60
    } = body;

    // Validate required fields
    if (!name || !script_content) {
      return errorResponse('MISSING_FIELDS', 'name and script_content are required');
    }

    // Generate unique access key
    const accessKey = generateAccessKey();

    const { data, error } = await supabase
      .from('protected_scripts')
      .insert({
        name,
        description,
        version: version || '1.0.0',
        script_content,
        access_key: accessKey,
        require_key,
        require_hwid,
        allowed_games: allowed_games || null,
        allowed_executors: allowed_executors || null,
        max_requests_per_minute,
        is_active: true,
        created_by: auth.discordId
      })
      .select()
      .single();

    if (error) {
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev';

    return successResponse({
      script: {
        id: data.id,
        name: data.name,
        access_key: data.access_key,
        loadstring_url: `${baseUrl}/api/script/${data.access_key}`,
        loadstring_code: `loadstring(game:HttpGet("${baseUrl}/api/script/${data.access_key}"))()`,
      },
      message: 'Script created successfully'
    });
  } catch (error) {
    console.error('Create script error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to create script', 500);
  }
}
