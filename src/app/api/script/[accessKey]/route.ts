import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { encryptScript, generateEncryptionKey } from '@/lib/encryption';
import { generateAccessDeniedHTML } from '@/lib/access-denied';
import CryptoJS from 'crypto-js';

// Known Roblox executor user agents and patterns
const EXECUTOR_PATTERNS = [
  'roblox', 'synapse', 'script-ware', 'scriptware', 'krnl', 
  'fluxus', 'oxygen', 'hydrogen', 'electron', 'evon',
  'arceus', 'comet', 'delta', 'trigon', 'vega',
  'httpget', 'syn', 'http_request', 'request',
  'robloxstudio', 'rbxstudio' // Roblox Studio
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

// Detect if request is from API testing tool (Postman, Insomnia, curl)
function isTestingTool(request: NextRequest): boolean {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const testingToolPatterns = ['postman', 'insomnia', 'curl', 'httpie', 'wget', 'fetch'];
  return testingToolPatterns.some(pattern => userAgent.includes(pattern));
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
  // STRICTER DETECTION: Must meet BOTH size AND multiple strong patterns
  const isLarge = script.length > 100000; // 100KB+ (stricter)
  
  const obfuscationPatterns = [
    /local _ENV.*getfenv/i,  // Common obfuscator pattern
    /\b[A-Za-z_]\w{40,}\b/, // Very long variable names (40+ chars, stricter)
    /\\x[0-9a-fA-F]{2}/,    // Hex escaped characters
    /loadstring.*getfenv/i,  // Loadstring with getfenv wrapper
    /_G\[['"].*['"]\]/,     // Global table obfuscation
    /_bsdata\d*/i,          // Luarmor pattern
    /string\.char\(\d+,\s*\d+,\s*\d+,\s*\d+,\s*\d+/i, // 5+ string.char args (stronger)
    /bit32\.(bxor|band|bor).*bit32\.(bxor|band|bor)/i, // Multiple bitwise ops
    /tonumber\([^,]+,\s*16\).*tonumber\([^,]+,\s*16\)/i, // Multiple hex parsing
    /table\.concat\s*\(.*table\.concat\s*\(/i,   // Multiple table.concat
    /local\s+function\s+[a-zA-Z_]\([a-zA-Z_],[a-zA-Z_]\).*bit32.*return/i, // XOR function
    /-- Obfuscated|-- Protected|-- Encrypted/i, // Explicit obfuscation markers
  ];
  
  // Require 5+ strong patterns (stricter than before)
  const matchCount = obfuscationPatterns.filter(pattern => pattern.test(script)).length;
  
  // BOTH conditions must be true (large size AND many patterns)
  return isLarge && matchCount >= 5;
}

// GET /api/script/[accessKey] - Serve protected script
export async function GET(request: NextRequest, { params }: ScriptParams) {
  const { accessKey } = await params;
  const startTime = Date.now();
  const isDevelopment = process.env.NODE_ENV === 'development';
  const devBypassEnabled = process.env.ENABLE_DEV_BYPASS === 'true';

  try {
    // 1. Check if request is from executor or testing tool
    const { isExecutor, executorName } = isExecutorRequest(request);
    const isTestTool = isTestingTool(request);
    
    // Allow: executors OR (testing tools in dev mode)
    const allowAccess = isExecutor || (devBypassEnabled && isTestTool);
    
    if (!allowAccess) {
      // Log blocked attempt
      await supabase.from('script_load_logs').insert({
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        executor: null,
        success: false,
        error_message: 'Browser access blocked'
      });

      // Return styled Access Denied page for browsers
      return new NextResponse(
        generateAccessDeniedHTML({
          title: 'Access Denied',
          message: 'You dont have permission to access this resource.',
          subtitle: '1337 elhub5k1 only',
          icon: '🔐'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Robots-Tag': 'noindex, nofollow',
          }
        }
      );
    }
    
    // Log if testing tool bypassed in dev
    if (isTestTool && devBypassEnabled) {
      console.log(`[DEV] Testing tool allowed: ${request.headers.get('user-agent')} → ${accessKey}`);
    }

    // 2. Find script by access key
    const { data: script, error } = await supabase
      .from('protected_scripts')
      .select('*')
      .eq('access_key', accessKey)
      .eq('is_active', true)
      .single();

    if (error || !script) {
      console.log(`[Script] Script not found: ${accessKey}`, error);
      return new NextResponse(
        `-- Script not found or inactive\nreturn nil`,
        { status: 200, headers: { 'Content-Type': 'text/plain' } }
      );
    }
    
    console.log(`[Script] Loading script: ${accessKey}, name: ${script.name}`);

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

    // 9. Return encrypted script (ALWAYS ENCRYPT PLAINTEXT, NO DEV BYPASS)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    // CRITICAL: ALWAYS use runtime validation if require_key is true (no dev bypass)
    const useRuntimeValidation = script.require_key;
    
    let finalScript: string;
    const watermark = `-- Protected by SixSense | ${accessKey.substring(0, 8)}... | ${new Date().toISOString().split('T')[0]}`;
    
    // Check if script already obfuscated by user (STRICTER DETECTION)
    const alreadyObfuscated = isAlreadyObfuscated(script.script_content);
    
    if (devBypassEnabled) {
      console.log(`[Security Check] Script ${accessKey}: size=${script.script_content.length}, obfuscated=${alreadyObfuscated}`);
    }
    
    if (alreadyObfuscated) {
      // Return as-is with optional key validation wrapper
      if (useRuntimeValidation) {
        finalScript = `${watermark}
-- Runtime Key Validation
local HttpService = game:GetService("HttpService")
local KEY = (getgenv and getgenv().SIXSENSE_KEY) or _G.SIXSENSE_KEY
if not KEY then return warn("[SixSense] No license key found") end
local s,r=pcall(function()return game:HttpGet("${baseUrl}/api/validate/key?key="..KEY.."&script=${accessKey}")end)
if not s or not r then return warn("[SixSense] Validation failed")end
local d=HttpService:JSONDecode(r)
if not d.valid then return warn("[SixSense] Invalid key: "..(d.error or"Unknown"))end
print("[SixSense] ✓ "..d.username)
-- Execute protected script (already obfuscated by owner)
${script.script_content}`;
      } else {
        finalScript = `${watermark}
-- Script already obfuscated by owner
${script.script_content}`;
      }
    } else {
      // Get or create encryption key from database (MUST be consistent with decoder)
      let encryptionKey = script.encryption_key;
      
      if (!encryptionKey) {
        // Generate new key if not exists (first time)
        encryptionKey = generateEncryptionKey(accessKey);
        
        // Save to database so decoder uses the same key
        await supabase
          .from('protected_scripts')
          .update({ encryption_key: encryptionKey })
          .eq('id', script.id);
        
        console.log(`[Security] New encryption key generated for ${accessKey}: ${encryptionKey.substring(0, 8)}...`);
      }
      
      // Encrypt using key from database - ensures loader and decoder use same key
      const { loader, dynamicKey } = encryptScript(
        script.script_content,
        accessKey,
        useRuntimeValidation,
        baseUrl,
        encryptionKey // Pass database key
      );
      
      console.log(`[Security] Encryption key for ${accessKey}: ${encryptionKey.substring(0, 8)}... (from db)`);
      
      finalScript = loader;
    }

    return new NextResponse(finalScript, {
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
