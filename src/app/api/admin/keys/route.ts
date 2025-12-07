import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateKey, errorResponse, successResponse } from '@/lib/utils';

// Simple API key auth for admin endpoints
function validateAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  
  const apiKey = authHeader.replace('Bearer ', '');
  return apiKey === process.env.API_SECRET_KEY;
}

// GET - List all keys
export async function GET(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: keys, error, count } = await supabase
      .from('keys')
      .select('*, users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return successResponse({
      keys,
      total: count,
      limit,
      offset
    });

  } catch (error) {
    console.error('List keys error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to list keys', 500);
  }
}

// POST - Generate new key
export async function POST(request: NextRequest) {
  if (!validateAdminAuth(request)) {
    return errorResponse('UNAUTHORIZED', 'Invalid API key', 401);
  }

  try {
    const body = await request.json();
    const { 
      discord_id, 
      discord_username,
      key_type = 'lifetime', 
      duration_days,
      created_by,
      prefix = 'SIX'
    } = body;

    // Create or find user if discord_id provided
    let userId = null;
    if (discord_id) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('discord_id', discord_id)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            discord_id,
            discord_username
          })
          .select()
          .single();

        if (userError) throw userError;
        userId = newUser.id;
      }
    }

    // Calculate expiry
    let expiresAt = null;
    if (key_type !== 'lifetime' && duration_days) {
      expiresAt = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString();
    }

    // Generate unique key
    let keyValue = generateKey(prefix);
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('keys')
        .select('id')
        .eq('key_value', keyValue)
        .single();
      
      if (!existing) break;
      keyValue = generateKey(prefix);
      attempts++;
    }

    // Insert key
    const { data: newKey, error: keyError } = await supabase
      .from('keys')
      .insert({
        key_value: keyValue,
        user_id: userId,
        key_type,
        duration_days,
        expires_at: expiresAt,
        created_by: created_by || 'API'
      })
      .select('*, users(*)')
      .single();

    if (keyError) throw keyError;

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_discord_id: created_by || 'API',
      action: 'generate_key',
      target_type: 'key',
      target_id: newKey.id,
      details: { key_type, discord_id }
    });

    return successResponse({
      key: newKey,
      message: 'Key generated successfully'
    }, 201);

  } catch (error) {
    console.error('Generate key error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to generate key', 500);
  }
}
