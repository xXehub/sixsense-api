import { NextRequest } from 'next/server';
import { validateToken } from '../validate/route';
import { errorResponse, successResponse } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Main script URL - change this to your actual script location
const MAIN_SCRIPT_URL = 'https://raw.githubusercontent.com/xXehub/sixsense-lastletter/master/new-main.lua';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // 1. Validate token
    if (!token || typeof token !== 'string') {
      return errorResponse('MISSING_TOKEN', 'Script token is required');
    }

    // 2. Verify token and get key ID
    const keyId = validateToken(token);
    if (!keyId) {
      return errorResponse('INVALID_TOKEN', 'Invalid or expired token. Please validate your key again.', 401);
    }

    // 3. Get the active script version from database
    const { data: scriptVersion } = await supabase
      .from('script_versions')
      .select('*')
      .eq('is_active', true)
      .single();

    // 4. Get user info for watermark
    const { data: keyData } = await supabase
      .from('keys')
      .select('*, users(*)')
      .eq('id', keyId)
      .single();

    const username = keyData?.users?.discord_username || 'Unknown';
    const keyValue = keyData?.key_value || 'Unknown';

    // 5. Determine script source
    let response: {
      success: boolean;
      version: string;
      script?: string;
      script_url?: string;
      watermark?: string;
    };

    if (scriptVersion && scriptVersion.script_content) {
      // Use script content from database
      const watermark = `-- Licensed to: ${username} (${keyValue})\n-- Generated: ${new Date().toISOString()}\n\n`;
      response = {
        success: true,
        version: scriptVersion.version || '2.0.0',
        script: watermark + scriptVersion.script_content,
        watermark: username
      };
    } else if (scriptVersion && scriptVersion.script_url) {
      // Use script URL from database
      response = {
        success: true,
        version: scriptVersion.version || '2.0.0',
        script_url: scriptVersion.script_url,
        watermark: username
      };
    } else {
      // Fallback to default script URL
      response = {
        success: true,
        version: process.env.SCRIPT_VERSION || '2.0.0',
        script_url: MAIN_SCRIPT_URL,
        watermark: username
      };
    }

    return successResponse(response);

  } catch (error) {
    console.error('Script delivery error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to load script', 500);
  }
}
