'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageBackground } from '@/components/ui/PageBackground';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  Gamepad2, 
  Play, 
  Users, 
  Clock, 
  Filter,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Zap
} from 'lucide-react';

interface Game {
  id: string;
  place_id: number;
  game_name: string;
  description: string;
  thumbnail_url: string | null;
  script_version: string;
  min_key_tier: string;
  is_active: boolean;
  total_executions: number;
}

export default function ScriptsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchGames();
  }, []);

  // Fetch Roblox thumbnails after games are loaded
  useEffect(() => {
    if (games.length > 0) {
      fetchThumbnails();
    }
  }, [games]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchThumbnails = async () => {
    try {
      const placeIds = games.map(g => g.place_id);
      const response = await fetch('/api/roblox/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeIds })
      });
      if (response.ok) {
        const data = await response.json();
        setThumbnails(data.thumbnails || {});
      }
    } catch (error) {
      console.error('Failed to fetch thumbnails:', error);
    }
  };

  const copyLoadstring = async (placeId: number) => {
    try {
      const loadstring = `loadstring(game:HttpGet("https://sixsense-api.vercel.app/api/loader/${placeId}"))()`;
      await navigator.clipboard.writeText(loadstring);
      setCopiedId(placeId.toString());
      addToast('Loadstring copied to clipboard', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const filteredGames = games.filter(game =>
    game.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge variant="warning" className="gap-1"><Zap className="w-3 h-3" /> Premium</Badge>;
      case 'vip':
        return <Badge variant="error" className="gap-1"><Shield className="w-3 h-3" /> VIP</Badge>;
      default:
        return <Badge variant="success" className="gap-1"><Check className="w-3 h-3" /> Free</Badge>;
    }
  };

  const formatExecutions = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get thumbnail: prioritize Roblox API, then database, then fallback
  const getGameThumbnail = (game: Game): string | null => {
    return thumbnails[game.place_id] || game.thumbnail_url || null;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 relative">
      <PageBackground variant="subtle" />
      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-4">SCRIPTS</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Supported <span className="text-primary">Games</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Browse our collection of premium scripts for popular Roblox games. 
            All scripts are undetected and regularly updated.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchInput
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
            />
          </div>
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />}>
            Filter
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card variant="default" hover>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-primary">{games.length}</p>
              <p className="text-sm text-muted">Supported Games</p>
            </CardContent>
          </Card>
          <Card variant="default" hover>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {formatExecutions(games.reduce((sum, g) => sum + (g.total_executions || 0), 0))}
              </p>
              <p className="text-sm text-muted">Total Executions</p>
            </CardContent>
          </Card>
          <Card variant="default" hover>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-500">100%</p>
              <p className="text-sm text-muted">Undetected</p>
            </CardContent>
          </Card>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredGames.length === 0 ? (
          <Card variant="default" className="text-center py-16">
            <CardContent>
              <Gamepad2 className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Games Found</h3>
              <p className="text-muted">
                {searchQuery ? 'Try a different search term.' : 'No supported games available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => {
              const thumbnail = getGameThumbnail(game);
              return (
              <Card key={game.id} variant="default" hover className="overflow-hidden group">
                {/* Thumbnail from Roblox API */}
                <div className="relative h-40 bg-background-lighter overflow-hidden">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={game.game_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background-card to-background-elevated">
                      <Gamepad2 className="w-16 h-16 text-muted" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getTierBadge(game.min_key_tier)}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                      v{game.script_version}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                    {game.game_name}
                  </h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2">
                    {game.description || 'No description available.'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted mb-4">
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>{formatExecutions(game.total_executions || 0)} uses</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Updated</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => copyLoadstring(game.place_id)}
                      leftIcon={copiedId === game.place_id.toString() ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    >
                      {copiedId === game.place_id.toString() ? 'Copied!' : 'Copy Script'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://www.roblox.com/games/${game.place_id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Request Game CTA */}
        <Card variant="glow" className="mt-12">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Game tidak ada dalam list?
            </h3>
            <p className="text-muted mb-6">
              Request game favoritmu dan tim kami akan membuatkan scriptnya!
            </p>
            <Button 
              variant="primary"
              onClick={() => window.open('https://discord.gg/sixsense', '_blank')}
            >
              Request di Discord
            </Button>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
