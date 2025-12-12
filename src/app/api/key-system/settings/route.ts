import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/key-system/settings - Get key system settings
export async function GET() {
  try {
    const { data: settings, error } = await supabase
      .from('key_system_settings')
      .select('*');

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch settings' 
      }, { status: 500 });
    }

    // Transform to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    return NextResponse.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT /api/key-system/settings - Update key system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Expect { key: value, key2: value2, ... } format
    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString()
    }));

    // Upsert each setting
    for (const update of updates) {
      const { error } = await supabase
        .from('key_system_settings')
        .upsert(update, { onConflict: 'key' });

      if (error) {
        console.error(`Error updating setting ${update.key}:`, error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to update setting: ${update.key}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
