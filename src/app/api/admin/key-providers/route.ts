import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/key-providers - Get all providers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = supabase
      .from('key_providers')
      .select('*')
      .order('priority', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Error fetching providers:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: providers || []
    });

  } catch (error) {
    console.error('Key providers API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/admin/key-providers - Create new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      provider_id,
      name,
      description,
      api_key,
      api_secret,
      base_url,
      link_id,
      link_slug, // Work.ink specific
      full_url,
      callback_url,
      verification_method,
      color,
      icon,
      duration_text,
      button_text,
      key_duration_days,
      key_type,
      max_keys_per_user,
      cooldown_hours,
      is_active,
      priority
    } = body;

    // Validate required fields
    if (!provider_id || !name || !base_url) {
      return NextResponse.json({
        success: false,
        error: 'provider_id, name, and base_url are required'
      }, { status: 400 });
    }

    const { data: provider, error } = await supabase
      .from('key_providers')
      .insert({
        provider_id,
        name,
        description,
        api_key,
        api_secret,
        base_url,
        link_id,
        link_slug, // Work.ink URL slug
        full_url: full_url || `${base_url}${link_id || ''}`,
        callback_url,
        verification_method: verification_method || 'manual',
        color: color || 'primary',
        icon: icon || 'Link2',
        duration_text: duration_text || '~2 minutes',
        button_text: button_text || 'Get Free Key',
        key_duration_days: key_duration_days || 7,
        key_type: key_type || 'weekly',
        max_keys_per_user: max_keys_per_user || 1,
        cooldown_hours: cooldown_hours || 24,
        is_active: is_active ?? false,
        priority: priority || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: provider,
      message: 'Provider created successfully'
    });

  } catch (error) {
    console.error('Create provider error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
