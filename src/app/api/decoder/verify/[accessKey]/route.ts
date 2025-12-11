import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import CryptoJS from 'crypto-js';
import { generateEncryptionKey } from '@/lib/encryption';

// Integrity verification endpoint - returns checksum for anti-tamper
export async function GET(
  request: NextRequest,
  { params }: { params: { accessKey: string } }
) {
  try {
    const { accessKey } = params;

    if (!accessKey) {
      return NextResponse.json(
        { error: 'Access key required' },
        { status: 400 }
      );
    }

    // Get script with encryption key
    const { data: script } = await supabase
      .from('protected_scripts')
      .select('encryption_key, access_key')
      .eq('access_key', accessKey)
      .single();

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    // Generate or retrieve encryption key
    let encryptionKey = script.encryption_key;
    if (!encryptionKey) {
      encryptionKey = generateEncryptionKey(accessKey);
    }

    // Generate checksum (MD5 hash of encryption key)
    const checksum = CryptoJS.MD5(encryptionKey).toString().substring(0, 8);

    // Return as plain text for easy Lua parsing
    return new NextResponse(checksum, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Decoder verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
