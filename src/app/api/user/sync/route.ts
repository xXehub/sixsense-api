import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id && !session?.user?.discordId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discordId = session.user.id || session.user.discordId;

    // Get or create user in database
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', discordId)
      .single();

    if (!user) {
      // Create user if doesn't exist
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

    // Get count of keys linked to this user
    const { count } = await supabase
      .from('keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({ 
      success: true,
      message: 'Sync complete',
      total_keys: count || 0
    });

  } catch (error) {
    console.error('Error in /api/user/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
