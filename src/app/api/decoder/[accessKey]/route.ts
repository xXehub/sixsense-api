import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateLuaDecoder } from '@/lib/encryption';
import CryptoJS from 'crypto-js';

interface DecoderParams {
  params: Promise<{
    accessKey: string;
  }>;
}

// GET /api/decoder/[accessKey] - Serve decoder script
export async function GET(request: NextRequest, { params }: DecoderParams) {
  const { accessKey } = await params;

  try {
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
