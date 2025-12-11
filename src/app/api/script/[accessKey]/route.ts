import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Known Roblox executor user agents and patterns
const EXECUTOR_PATTERNS = [
  'roblox', 'synapse', 'script-ware', 'scriptware', 'krnl', 
  'fluxus', 'oxygen', 'hydrogen', 'electron', 'evon',
  'arceus', 'comet', 'delta', 'trigon', 'vega',
  'httpget', 'syn', 'http_request', 'request'
];

// Browser user agents to block
const BROWSER_PATTERNS = [
  'mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera',
  'webkit', 'gecko', 'trident', 'applewebkit'
];

interface ScriptParams {
  params: Promise<{
    accessKey: string;
  }>;
}

// Detect if request is from Roblox executor
function isExecutorRequest(request: NextRequest): { isExecutor: boolean; executorName: string | null } {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const robloxSecurity = request.headers.get('roblox-security');
  const synHeader = request.headers.get('syn-fingerprint');
  const httpGetHeader = request.headers.get('user-agent')?.includes('HttpGet');
  
  // Check for explicit executor headers
  if (synHeader || robloxSecurity) {
    return { isExecutor: true, executorName: synHeader ? 'synapse' : 'roblox' };
  }

  // Check for known browser patterns - if found, likely NOT an executor
  const isBrowser = BROWSER_PATTERNS.some(pattern => userAgent.includes(pattern));
  
  // Check for executor patterns
  for (const pattern of EXECUTOR_PATTERNS) {
    if (userAgent.includes(pattern)) {
      return { isExecutor: true, executorName: pattern };
    }
  }

  // If no user agent at all, might be executor (some don't send UA)
  if (!userAgent || userAgent.length < 5) {
    return { isExecutor: true, executorName: 'unknown' };
  }

  // If it looks like a browser, reject
  if (isBrowser && !httpGetHeader) {
    return { isExecutor: false, executorName: null };
  }

  // Default: allow if not clearly a browser
  return { isExecutor: !isBrowser, executorName: 'unknown' };
}

// Detect if script is already obfuscated (WeAreDevs, Luarmor, etc)
function isAlreadyObfuscated(script: string): boolean {
  const obfuscationPatterns = [
    /local _ENV.*getfenv/,  // Common obfuscator pattern
    /\b[A-Za-z_]\w{30,}\b/, // Very long variable names
    /\\x[0-9a-fA-F]{2}/,    // Hex escaped characters
    /loadstring.*getfenv/,  // Loadstring with getfenv wrapper
    /_G\[.*\]\s*=/,         // Global table obfuscation
  ];
  
  return obfuscationPatterns.some(pattern => pattern.test(script));
}

// Simple script wrapping with runtime key validation (NO OBFUSCATION)
// User should obfuscate manually before uploading to protected_scripts
function wrapScript(
  script: string, 
  accessKey: string, 
  requireKey: boolean,
  baseUrl: string
): string {
  const watermark = `-- Protected by SixSense | ${accessKey.substring(0, 8)}... | ${new Date().toISOString().split('T')[0]}`;
  const isObfuscated = isAlreadyObfuscated(script);
  
  // If no key required, return script as-is (already obfuscated by user)
  if (!requireKey) {
    return `${watermark}
-- Script already obfuscated by owner
${script}`;
  }

  // With runtime key validation (wrap around existing obfuscated script)
  return `${watermark}
-- Runtime Key Validation
local HttpService = game:GetService("HttpService")
local KEY = (getgenv and getgenv().SIXSENSE_KEY) or _G.SIXSENSE_KEY

if not KEY then
    return warn("[SixSense] No license key found! Set _G.SIXSENSE_KEY before loading.")
end

-- Validate with server
local success, response = pcall(function()
    return game:HttpGet("${baseUrl}/api/validate/key?key=" .. KEY .. "&script=${accessKey}")
end)

if not success or not response then
    return warn("[SixSense] Failed to validate license key. Check connection.")
end

local data = HttpService:JSONDecode(response)

if not data.valid then
    return warn("[SixSense] Invalid license key: " .. (data.error or "Unknown error"))
end

print("[SixSense] ✓ Validated: " .. (data.username or "User"))

-- Execute protected script (already obfuscated by owner)
${script}`;
}

// GET /api/script/[accessKey] - Serve protected script
export async function GET(request: NextRequest, { params }: ScriptParams) {
  const { accessKey } = await params;
  const startTime = Date.now();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devBypassEnabled = process.env.ENABLE_DEV_BYPASS === 'true';

  try {
    // 1. Check if request is from executor
    const { isExecutor, executorName } = isExecutorRequest(request);
    
    if (!isExecutor) {
      // Log blocked attempt
      await supabase.from('script_load_logs').insert({
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        executor: null,
        success: false,
        error_message: 'Browser access blocked'
      });

      // Return fake/decoy response for browsers
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev';
      return new NextResponse(
        `-- Access Denied\n-- This script can only be loaded via Roblox executor\n-- Visit ${baseUrl} for more info\nreturn nil`,
        {
          status: 200, // Return 200 to not give info to scrapers
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Robots-Tag': 'noindex, nofollow',
          }
        }
      );
    }

    // 2. Find script by access key
    const { data: script, error } = await supabase
      .from('protected_scripts')
      .select('*')
      .eq('access_key', accessKey)
      .eq('is_active', true)
      .single();

    if (error || !script) {
      return new NextResponse(
        `-- Script not found or inactive\nreturn nil`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    // 3. Get additional info from query params (sent by loader)
    const searchParams = request.nextUrl.searchParams;
    const providedKey = searchParams.get('key');
    const hwid = searchParams.get('hwid');
    const playerId = searchParams.get('player_id');
    const playerName = searchParams.get('player_name');
    const gameId = searchParams.get('game_id');

    // 4. Handle key requirement
    // NEW APPROACH: Always return wrapped script with runtime validation
    // No more URL parameter key checking - all validation happens at runtime in Lua
    
    // Development bypass: allow ?bypass=dev parameter (only if enabled in env)
    const bypassParam = searchParams.get('bypass');
    const allowDevBypass = isDevelopment && devBypassEnabled && bypassParam === 'dev';
    
    if (allowDevBypass) {
      console.log('[DEV MODE] Bypassing key requirement for testing');
    }

    // 5. Check allowed games
    if (script.allowed_games && script.allowed_games.length > 0 && gameId) {
      if (!script.allowed_games.includes(gameId)) {
        await logScriptLoad(accessKey, request, executorName, hwid, playerId, playerName, gameId, providedKey, false, 'Game not allowed');
        return new NextResponse(
          `-- This script is not available for this game\nreturn nil`,
          { status: 200, headers: { 'Content-Type': 'text/plain' } }
        );
      }
    }

    // 6. Check allowed executors
    if (script.allowed_executors && script.allowed_executors.length > 0 && executorName) {
      const allowed = script.allowed_executors.some((e: string) => 
        executorName.toLowerCase().includes(e.toLowerCase())
      );
      if (!allowed) {
        await logScriptLoad(accessKey, request, executorName, hwid, playerId, playerName, gameId, providedKey, false, 'Executor not allowed');
        return new NextResponse(
          `-- This executor is not supported\nreturn nil`,
          { status: 200, headers: { 'Content-Type': 'text/plain' } }
        );
      }
    }

    // 7. Update script stats
    await supabase
      .from('protected_scripts')
      .update({
        total_loads: (script.total_loads || 0) + 1,
        last_loaded_at: new Date().toISOString()
      })
      .eq('id', script.id);

    // 8. Log successful load
    await logScriptLoad(accessKey, request, executorName, hwid, playerId, playerName, gameId, providedKey, true, null);

    // 9. Return wrapped script with runtime validation (if needed)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sixsense.dev';
    const useRuntimeValidation = script.require_key && !allowDevBypass;
    
    const wrappedScript = wrapScript(
      script.script_content, 
      accessKey, 
      useRuntimeValidation,
      baseUrl
    );

    return new NextResponse(wrappedScript, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    console.error('Script serve error:', error);
    return new NextResponse(
      `-- Server error\nreturn nil`,
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

// Helper function to log script loads
async function logScriptLoad(
  accessKey: string,
  request: NextRequest,
  executor: string | null,
  hwid: string | null,
  playerId: string | null,
  playerName: string | null,
  gameId: string | null,
  keyUsed: string | null,
  success: boolean,
  errorMessage: string | null
) {
  try {
    // Get script ID
    const { data: script } = await supabase
      .from('protected_scripts')
      .select('id')
      .eq('access_key', accessKey)
      .single();

    if (script) {
      await supabase.from('script_load_logs').insert({
        script_id: script.id,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        executor,
        hwid,
        player_id: playerId ? parseInt(playerId) : null,
        player_name: playerName,
        game_id: gameId ? parseInt(gameId) : null,
        key_used: keyUsed,
        success,
        error_message: errorMessage
      });
    }
  } catch (err) {
    console.error('Failed to log script load:', err);
  }
}
