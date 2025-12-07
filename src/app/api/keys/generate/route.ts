import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Generate a random key
function generateKey(type: string): string {
  const prefix = type === 'lifetime' ? 'SS-LT' : type === 'weekly' ? 'SS-WK' : 'SS-DY';
  const random = randomBytes(12).toString('hex').toUpperCase();
  return `${prefix}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}`;
}

// Calculate expiry date based on key type
function calculateExpiry(type: string): Date | null {
  const now = new Date();
  switch (type) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'lifetime':
      return null; // Never expires
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id && !session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized. Please login with Discord.' }, { status: 401 });
    }

    const discordId = session.user.id || session.user.discordId;
    const body = await request.json();
    const { key_type = 'daily' } = body;

    // Validate key type
    if (!['daily', 'weekly', 'monthly', 'lifetime'].includes(key_type)) {
      return NextResponse.json({ error: 'Invalid key type' }, { status: 400 });
    }

    // Don't allow generating lifetime keys through this API (must be purchased)
    if (key_type === 'lifetime') {
      return NextResponse.json({ error: 'Lifetime keys must be purchased' }, { status: 403 });
    }

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          discord_id: discordId,
          discord_username: session.user.name || session.user.username,
          discord_avatar: session.user.image || session.user.avatar,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    // Check for existing active key of same type
    const { data: existingKey } = await supabase
      .from('keys')
      .select('id, key_value, expires_at')
      .eq('user_id', user.id)
      .eq('key_type', key_type)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingKey) {
      return NextResponse.json({
        success: true,
        key: existingKey.key_value,
        expires_at: existingKey.expires_at,
        message: 'You already have an active key of this type'
      });
    }

    // Generate new key
    const keyValue = generateKey(key_type);
    const expiresAt = calculateExpiry(key_type);

    const { data: newKey, error: keyError } = await supabase
      .from('keys')
      .insert({
        key_value: keyValue,
        user_id: user.id,
        key_type: key_type,
        expires_at: expiresAt?.toISOString(),
        created_by: discordId,
        is_active: true,
        max_hwid_resets: key_type === 'daily' ? 1 : key_type === 'weekly' ? 3 : 5
      })
      .select('id, key_value, expires_at, key_type')
      .single();

    if (keyError) {
      console.error('Error creating key:', keyError);
      return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      key: newKey.key_value,
      key_type: newKey.key_type,
      expires_at: newKey.expires_at,
      message: 'Key generated successfully'
    });

  } catch (error) {
    console.error('Error in /api/keys/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
