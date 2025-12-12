import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/admin/key-providers/[id] - Get single provider
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const { data: provider, error } = await supabase
      .from('key_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !provider) {
      return NextResponse.json({
        success: false,
        error: 'Provider not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('Get provider error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/admin/key-providers/[id] - Update provider
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();

    // Remove id from body to prevent conflicts
    const { id: _, ...updateData } = body;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Generate full_url if link_id or base_url changed
    if (updateData.link_id !== undefined || updateData.base_url !== undefined) {
      const base = updateData.base_url || body.base_url;
      const linkId = updateData.link_id || body.link_id;
      if (!updateData.full_url) {
        updateData.full_url = `${base}${linkId || ''}`;
      }
    }

    const { data: provider, error } = await supabase
      .from('key_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: provider,
      message: 'Provider updated successfully'
    });

  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/key-providers/[id] - Delete provider
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const { error } = await supabase
      .from('key_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting provider:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully'
    });

  } catch (error) {
    console.error('Delete provider error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
