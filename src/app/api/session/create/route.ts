import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, discord_id } = body;

    if (!provider || !discord_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Check if user already has pending session for this provider
    const { data: existingSessions } = await supabase
      .from('provider_completions')
      .select('*')
      .eq('discord_id', discord_id)
      .eq('provider_id', provider)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());

    // If existing session found, return it
    if (existingSessions && existingSessions.length > 0) {
      const existing = existingSessions[0];
      return NextResponse.json({
        success: true,
        session: {
          sessionId: existing.session_id,
          status: existing.status,
          expiresAt: existing.expires_at
        }
      });
    }

    // Get user IP from request
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Create new session
    const { data, error } = await supabase
      .from('provider_completions')
      .insert({
        session_id: sessionId,
        discord_id,
        provider_id: provider,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        ip_address: ip,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      session: {
        sessionId: data.session_id,
        status: data.status,
        expiresAt: data.expires_at
      }
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
