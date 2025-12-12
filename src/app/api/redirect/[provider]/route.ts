import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Get provider config (check if exists first)
    const { data: providerData, error: providerError } = await supabase
      .from('key_providers')
      .select('*')
      .eq('provider_id', provider)
      .single();

    if (providerError || !providerData) {
      console.error('Provider lookup error:', {
        provider,
        error: providerError?.message,
        code: providerError?.code,
        details: providerError?.details
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider not found',
          details: {
            provider,
            message: 'Provider does not exist in database',
            hint: 'Go to /x-admin-panel/key-system to add provider, or run database/check-providers.sql'
          }
        },
        { status: 404 }
      );
    }

    // Check if active
    if (!providerData.is_active) {
      console.warn('Provider exists but disabled:', {
        provider,
        name: providerData.name
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Provider is disabled',
          details: {
            provider: providerData.name,
            message: 'This provider is currently disabled',
            hint: 'Go to /x-admin-panel/key-system and enable this provider',
            action: 'Enable in admin panel'
          }
        },
        { status: 403 }
      );
    }

    // Check if link_id is configured (for Work.ink)
    if (provider === 'workink' && (!providerData.link_id || providerData.link_id === 'YOUR_LINK_ID_HERE')) {
      console.warn('Work.ink link_id not configured:', {
        provider,
        link_id: providerData.link_id
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Work.ink Link ID not configured',
          details: {
            provider: 'Work.ink',
            message: 'Link ID is required for Work.ink',
            current_value: providerData.link_id || '(empty)',
            hint: 'Go to /x-admin-panel/key-system → Edit Work.ink → Set your Link ID from Work.ink dashboard',
            documentation: 'See WORKINK-SETUP-GUIDE.md for instructions'
          }
        },
        { status: 400 }
      );
    }

    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('provider_completions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Build redirect URL based on provider
    let redirectUrl = '';

    switch (provider) {
      case 'workink': {
        // Work.ink URL format:
        // Option 1: Direct token URL: https://work.ink/token
        // Option 2: Custom with placeholder: https://yourdomain.com/verify?token={TOKEN}
        // For now, use direct Work.ink links with session tracking
        
        if (providerData.full_url) {
          // Use full_url and append session as query param
          const url = new URL(providerData.full_url);
          url.searchParams.set('sr', sessionId);
          redirectUrl = url.toString();
        } else if (providerData.link_id) {
          // Build Work.ink link: work.ink/YOUR_ID/custom-slug?sr=session
          redirectUrl = `https://work.ink/${providerData.link_id}?sr=${sessionId}`;
        } else {
          return NextResponse.json(
            { success: false, error: 'Work.ink link ID not configured' },
            { status: 500 }
          );
        }
        break;
      }

      case 'linkvertise': {
        // Linkvertise URL format: https://link-target.net/YOUR_USER_ID/LINK_ID?sr=ENCODED_SESSION
        if (providerData.full_url) {
          const url = new URL(providerData.full_url);
          url.searchParams.set('sr', sessionId);
          redirectUrl = url.toString();
        } else {
          return NextResponse.json(
            { success: false, error: 'Provider configuration incomplete' },
            { status: 500 }
          );
        }
        break;
      }

      case 'lootlabs': {
        // Lootlabs URL format: https://loot-link.com/s?YOUR_ID&sr=ENCODED_SESSION
        if (providerData.full_url) {
          const url = new URL(providerData.full_url);
          url.searchParams.set('sr', sessionId);
          redirectUrl = url.toString();
        } else {
          return NextResponse.json(
            { success: false, error: 'Provider configuration incomplete' },
            { status: 500 }
          );
        }
        break;
      }

      default: {
        // Generic provider - use full_url or base_url
        if (providerData.full_url) {
          const url = new URL(providerData.full_url);
          url.searchParams.set('session', sessionId);
          redirectUrl = url.toString();
        } else if (providerData.base_url) {
          const url = new URL(providerData.base_url);
          url.searchParams.set('session', sessionId);
          if (providerData.link_id) {
            url.searchParams.set('id', providerData.link_id);
          }
          redirectUrl = url.toString();
        } else {
          return NextResponse.json(
            { success: false, error: 'Provider configuration incomplete' },
            { status: 500 }
          );
        }
      }
    }

    // Log the redirect attempt
    await supabase
      .from('provider_completions')
      .update({
        referrer: request.headers.get('referer') || '',
        user_agent: request.headers.get('user-agent') || '',
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    // Redirect to provider
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Error redirecting to provider:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
