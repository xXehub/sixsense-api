import { NextRequest } from 'next/server';
import { validateToken } from '../validate/route';
import { errorResponse, successResponse } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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

    // 3. Get the active script version
    const { data: scriptVersion } = await supabase
      .from('script_versions')
      .select('*')
      .eq('is_active', true)
      .single();

    let scriptContent: string;

    if (scriptVersion && scriptVersion.script_content) {
      // Use script from database
      scriptContent = scriptVersion.script_content;
    } else {
      // Fallback: Load from GitHub or local
      // In production, you'd fetch from your actual script source
      scriptContent = getDefaultScript();
    }

    // 4. Optional: Inject user watermark into script
    // This helps identify who leaked the script
    const { data: keyData } = await supabase
      .from('keys')
      .select('*, users(*)')
      .eq('id', keyId)
      .single();

    if (keyData) {
      const watermark = `-- Licensed to: ${keyData.users?.discord_username || 'Unknown'} (${keyData.key_value})`;
      scriptContent = watermark + '\n' + scriptContent;
    }

    // 5. Return the script
    return successResponse({
      version: scriptVersion?.version || process.env.SCRIPT_VERSION || '2.0.0',
      script: scriptContent
    });

  } catch (error) {
    console.error('Script delivery error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to load script', 500);
  }
}

// Default script (placeholder - replace with actual script loading)
function getDefaultScript(): string {
  return `
--[[
    sixsense - Last Letter Helper
    Loaded via Key System
    
    This script was loaded successfully!
    Replace this with your actual main script content.
]]

print("[sixsense] Script loaded successfully via key system!")
print("[sixsense] Version: " .. (SIXSENSE_VERSION or "Unknown"))

-- Your actual script content would go here
-- You can either:
-- 1. Store full script in database (script_versions table)
-- 2. Fetch from GitHub private repo
-- 3. Embed the script here

-- For now, this is a placeholder
-- Replace getDefaultScript() with your actual script loading logic
`;
}
