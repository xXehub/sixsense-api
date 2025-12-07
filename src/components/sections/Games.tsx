'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '../layout/Container';
import { Section, SectionHeader } from '../layout/Section';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRight, Gamepad2, Play, Loader2 } from 'lucide-react';

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

export function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, string | null>>({});
  const [loading, setLoading] = useState(true);

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
        // Take only first 4 games for homepage
        setGames((data.games || []).slice(0, 4));
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

  const formatExecutions = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getGameThumbnail = (game: Game): string | null => {
    return thumbnails[game.place_id] || game.thumbnail_url || null;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return { variant: 'warning' as const, label: 'Premium' };
      case 'vip':
        return { variant: 'error' as const, label: 'VIP' };
      default:
        return { variant: 'success' as const, label: 'Free' };
    }
  };

  return (
    <Section>
      <Container>
        <SectionHeader
          title="Supported Games"
          subtitle="Our scripts work across multiple popular Roblox games."
        />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 className="w-16 h-16 text-muted mx-auto mb-4" />
            <p className="text-muted">No games available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => {
              const thumbnail = getGameThumbnail(game);
              const tierInfo = getTierBadge(game.min_key_tier);
              
              return (
                <Card
                  key={game.id}
                  hover
                  padding="none"
                  className="overflow-hidden group"
                >
                  {/* Game Image from Roblox API */}
                  <div className="h-32 bg-gradient-to-br from-[var(--background-elevated)] to-[var(--background-card)] flex items-center justify-center relative overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={game.game_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Gamepad2 className="w-12 h-12 text-[var(--border)] group-hover:text-[var(--primary)] group-hover:scale-110 transition-all" />
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={tierInfo.variant}
                        size="sm"
                        dot
                        pulse={game.is_active}
                      >
                        {tierInfo.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-[var(--text)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                      {game.game_name}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2">
                      {game.description || 'No description available'}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        <span>{formatExecutions(game.total_executions || 0)} uses</span>
                      </div>
                      <span className="text-[var(--primary)]">v{game.script_version}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-10 text-center">
          <Link href="/scripts">
            <Button
              variant="outline"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All Scripts
            </Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export default Games;
