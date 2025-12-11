import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import fs from 'fs';
import path from 'path';

async function validateAuth(request: NextRequest): Promise<{ valid: boolean }> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const apiKey = authHeader.replace('Bearer ', '');
    if (apiKey === process.env.API_SECRET_KEY) {
      return { valid: true };
    }
  }
  
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.id || (session?.user as { discordId?: string })?.discordId;
  
  if (isAdmin(discordId)) {
    return { valid: true };
  }
  
  return { valid: false };
}

// GET /api/admin/settings/dev-bypass - Get current status
export async function GET(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const enabled = process.env.ENABLE_DEV_BYPASS === 'true';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json({
      success: true,
      enabled,
      isDevelopment,
      canToggle: isDevelopment
    });
  } catch (error) {
    console.error('Get dev bypass error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'SERVER_ERROR' 
    }, { status: 500 });
  }
}

// POST /api/admin/settings/dev-bypass - Toggle dev bypass
export async function POST(request: NextRequest) {
  const auth = await validateAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      return NextResponse.json({
        success: false,
        error: 'PRODUCTION_MODE',
        message: 'Dev bypass can only be toggled in development mode'
      }, { status: 400 });
    }

    const body = await request.json();
    const { enabled } = body;

    // Read .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update or add ENABLE_DEV_BYPASS line
    const bypassRegex = /ENABLE_DEV_BYPASS=.*/;
    const newValue = `ENABLE_DEV_BYPASS=${enabled ? 'true' : 'false'}`;

    if (bypassRegex.test(envContent)) {
      envContent = envContent.replace(bypassRegex, newValue);
    } else {
      envContent += `\n\n# Development Mode (enable bypass for testing)\n${newValue}\n`;
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent, 'utf8');

    // Update process.env (won't take effect until server restart)
    process.env.ENABLE_DEV_BYPASS = enabled ? 'true' : 'false';

    return NextResponse.json({
      success: true,
      enabled,
      message: 'Dev bypass updated. Please restart server for changes to take effect.',
      requiresRestart: true
    });
  } catch (error) {
    console.error('Toggle dev bypass error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'SERVER_ERROR',
      message: String(error)
    }, { status: 500 });
  }
}
