import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Fetch session from database
    const { data, error } = await supabase
      .from('provider_completions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date(data.expires_at) < new Date();
    if (isExpired && data.status !== 'completed') {
      // Update status to expired
      await supabase
        .from('provider_completions')
        .update({ status: 'expired' })
        .eq('session_id', sessionId);

      return NextResponse.json({
        success: true,
        session: {
          sessionId: data.session_id,
          status: 'expired',
          expiresAt: data.expires_at
        }
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: data.session_id,
        status: data.status,
        key: data.key,
        expiresAt: data.expires_at,
        completedAt: data.completed_at
      }
    });
  } catch (error: any) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
