import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/key-providers - Public endpoint for get-key page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'free' or 'premium'

    // Build query for active providers
    let query = supabase
      .from('key_providers')
      .select('id, provider_id, name, description, icon, color, base_url, link_id, full_url, key_duration_days, is_premium, priority')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    // Filter by type if specified
    if (type === 'free') {
      query = query.eq('is_premium', false);
    } else if (type === 'premium') {
      query = query.eq('is_premium', true);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch providers',
        details: error.message
      }, { status: 500 });
    }

    // Transform providers for client consumption (hide sensitive data)
    const clientProviders = providers.map(provider => ({
      id: provider.provider_id,
      name: provider.name,
      description: provider.description,
      icon: provider.icon,
      color: provider.color,
      url: provider.full_url || `${provider.base_url || ''}${provider.link_id || ''}`,
      duration: provider.key_duration_days,
      isPremium: provider.is_premium
    }));

    return NextResponse.json({
      success: true,
      data: clientProviders
    });

  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
