import { NextRequest, NextResponse } from 'next/server';

// Roblox API endpoints
const ROBLOX_THUMBNAIL_API = 'https://thumbnails.roblox.com/v1/games/icons';
const ROBLOX_GAME_API = 'https://games.roblox.com/v1/games';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  }

  try {
    // First, get the universe ID from place ID
    const universeResponse = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!universeResponse.ok) {
      throw new Error('Failed to get universe ID');
    }

    const universeData = await universeResponse.json();
    const universeId = universeData.universeId;

    // Get game thumbnail using universe ID
    const thumbnailResponse = await fetch(
      `${ROBLOX_THUMBNAIL_API}?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } }
    );

    if (!thumbnailResponse.ok) {
      throw new Error('Failed to get thumbnail');
    }

    const thumbnailData = await thumbnailResponse.json();
    const thumbnail = thumbnailData.data?.[0];

    if (thumbnail?.state === 'Completed' && thumbnail?.imageUrl) {
      return NextResponse.json({
        success: true,
        thumbnailUrl: thumbnail.imageUrl,
        universeId: universeId
      });
    }

    // Fallback: Try to get game icon directly
    const gameResponse = await fetch(
      `${ROBLOX_GAME_API}?universeIds=${universeId}`,
      { next: { revalidate: 3600 } }
    );

    if (gameResponse.ok) {
      const gameData = await gameResponse.json();
      const game = gameData.data?.[0];
      
      return NextResponse.json({
        success: true,
        thumbnailUrl: null,
        gameName: game?.name,
        universeId: universeId,
        message: 'Thumbnail pending, use placeholder'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Could not fetch thumbnail'
    }, { status: 404 });

  } catch (error) {
    console.error('Roblox thumbnail fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch from Roblox API'
    }, { status: 500 });
  }
}

// Batch fetch multiple game thumbnails
export async function POST(request: NextRequest) {
  try {
    const { placeIds } = await request.json();

    if (!Array.isArray(placeIds) || placeIds.length === 0) {
      return NextResponse.json({ error: 'placeIds array is required' }, { status: 400 });
    }

    // Limit to 50 at a time
    const limitedIds = placeIds.slice(0, 50);

    // Get universe IDs for all place IDs
    const universePromises = limitedIds.map(async (placeId: number) => {
      try {
        const response = await fetch(
          `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
          { next: { revalidate: 3600 } }
        );
        if (response.ok) {
          const data = await response.json();
          return { placeId, universeId: data.universeId };
        }
        return { placeId, universeId: null };
      } catch {
        return { placeId, universeId: null };
      }
    });

    const universeResults = await Promise.all(universePromises);
    const validUniverses = universeResults.filter(r => r.universeId);
    const universeIds = validUniverses.map(r => r.universeId).join(',');

    if (!universeIds) {
      return NextResponse.json({
        success: true,
        thumbnails: {}
      });
    }

    // Batch fetch thumbnails
    const thumbnailResponse = await fetch(
      `${ROBLOX_THUMBNAIL_API}?universeIds=${universeIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`,
      { next: { revalidate: 3600 } }
    );

    const thumbnailData = await thumbnailResponse.json();
    
    // Create a map of universeId to thumbnail URL
    const thumbnailMap: Record<number, string | null> = {};
    
    if (thumbnailData.data) {
      for (const thumb of thumbnailData.data) {
        if (thumb.state === 'Completed' && thumb.imageUrl) {
          thumbnailMap[thumb.targetId] = thumb.imageUrl;
        }
      }
    }

    // Map back to placeIds
    const result: Record<number, string | null> = {};
    for (const { placeId, universeId } of validUniverses) {
      result[placeId] = thumbnailMap[universeId] || null;
    }

    return NextResponse.json({
      success: true,
      thumbnails: result
    });

  } catch (error) {
    console.error('Batch thumbnail fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch thumbnails'
    }, { status: 500 });
  }
}
