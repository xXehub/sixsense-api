import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateLuaDecoder } from '@/lib/encryption';
import { generateAccessDeniedHTML } from '@/lib/access-denied';
import CryptoJS from 'crypto-js';

interface DecoderParams {
  params: Promise<{
    accessKey: string;
  }>;
}

// Known Roblox executor patterns
const EXECUTOR_PATTERNS = [
  'roblox', 'synapse', 'script-ware', 'scriptware', 'krnl', 
  'fluxus', 'oxygen', 'hydrogen', 'electron', 'evon',
  'arceus', 'comet', 'delta', 'trigon', 'vega',
  'httpget', 'syn', 'http_request', 'request'
];

// Browser patterns to block
const BROWSER_PATTERNS = [
  'mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera',
  'webkit', 'gecko', 'trident', 'applewebkit'
];

// Check if request is from executor (NOT browser/Postman)
function isExecutorRequest(request: NextRequest): boolean {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const robloxSecurity = request.headers.get('roblox-security');
  const synHeader = request.headers.get('syn-fingerprint');
  
  // Check executor headers first
  if (synHeader || robloxSecurity) return true;
  
  // Check executor patterns in user agent
  if (EXECUTOR_PATTERNS.some(pattern => userAgent.includes(pattern))) {
    return true;
  }
  
  // Block browsers explicitly
  if (BROWSER_PATTERNS.some(pattern => userAgent.includes(pattern))) {
    return false;
  }
  
  // Block testing tools
  const testToolPatterns = ['postman', 'insomnia', 'curl', 'wget', 'python-requests', 'httpie'];
  if (testToolPatterns.some(pattern => userAgent.includes(pattern))) {
    return false;
  }
  
  // Allow empty or very short user agents (some executors don't send UA)
  if (!userAgent || userAgent.length < 5) return true;
  
  // Default: allow (some executors use generic UAs)
  return true;
}

// GET /api/decoder/[accessKey] - Serve decoder script (EXECUTOR ONLY)
export async function GET(request: NextRequest, { params }: DecoderParams) {
  const { accessKey } = await params;

  try {
    // 0. SECURITY: Block browsers and testing tools
    if (!isExecutorRequest(request)) {
      return new NextResponse(
        generateAccessDeniedHTML({
          title: 'Decoder Protected',
          message: 'This endpoint is protected and can only be accessed via Roblox Executor',
          subtitle: 'The decoder is automatically fetched by the loader script.',
          icon: '🛡️'
        }),
        { 
          status: 403,
          headers: { 
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow'
          } 
        }
      );
    }
    
    // 1. Verify script exists
    const { data: script, error } = await supabase
      .from('protected_scripts')
      .select('id, access_key, encryption_key')
      .eq('access_key', accessKey)
      .eq('is_active', true)
      .single();

    if (error || !script) {
      return new NextResponse(
        '-- Decoder not found\nreturn function() warn("[SixSense] Invalid decoder request") end',
        { 
          status: 200, 
          headers: { 'Content-Type': 'text/plain' } 
        }
      );
    }

    // 2. Get or generate encryption key for this script
    let encryptionKey = script.encryption_key;
    
    if (!encryptionKey) {
      // Generate new key if not exists
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 15);
      encryptionKey = CryptoJS.SHA256(accessKey + timestamp + random).toString();
      
      // Save to database
      await supabase
        .from('protected_scripts')
        .update({ encryption_key: encryptionKey })
        .eq('id', script.id);
    }

    // 3. Generate decoder script
    // Note: The decoder doesn't need the encrypted data, 
    // that's passed by the loader
    const decoder = generateLuaDecoder('', encryptionKey, accessKey);

    // 4. Return decoder with cache headers
    return new NextResponse(decoder, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex, nofollow',
      }
    });

  } catch (error) {
    console.error('Decoder serve error:', error);
    return new NextResponse(
      '-- Decoder error\nreturn function() warn("[SixSense] Decoder error") end',
      { 
        status: 200, 
        headers: { 'Content-Type': 'text/plain' } 
      }
    );
  }
}
