'use client';

import Link from 'next/link';
import { Container } from '../layout/Container';
import { Section, SectionHeader } from '../layout/Section';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRight, Gamepad2, Users, Star } from 'lucide-react';

// Example games - in production, fetch from API
const games = [
  {
    id: 1,
    name: 'Words Bomb',
    placeId: 2753915549,
    description: 'Auto answer word puzzles instantly',
    image: '/games/words-bomb.png',
    status: 'working',
    users: '5.2K',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Pet Simulator X',
    placeId: 6872265039,
    description: 'Auto farm pets and diamonds',
    image: '/games/pet-sim-x.png',
    status: 'working',
    users: '3.8K',
    rating: 4.7,
  },
  {
    id: 3,
    name: 'Blox Fruits',
    placeId: 2753915549,
    description: 'Auto farm, auto raid, fruit finder',
    image: '/games/blox-fruits.png',
    status: 'updating',
    users: '8.1K',
    rating: 4.8,
  },
  {
    id: 4,
    name: 'Murder Mystery 2',
    placeId: 142823291,
    description: 'ESP, aimbot, and more',
    image: '/games/mm2.png',
    status: 'working',
    users: '2.4K',
    rating: 4.6,
  },
];

const statusColors = {
  working: 'success',
  updating: 'warning',
  broken: 'error',
} as const;

const statusLabels = {
  working: 'Working',
  updating: 'Updating',
  broken: 'Broken',
};

export function Games() {
  return (
    <Section>
      <Container>
        <SectionHeader
          title="Supported Games"
          subtitle="Our scripts work across multiple popular Roblox games."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Card
              key={game.id}
              hover
              padding="none"
              className="overflow-hidden group"
            >
              {/* Game Image/Placeholder */}
              <div className="h-32 bg-gradient-to-br from-[var(--background-elevated)] to-[var(--background-card)] flex items-center justify-center relative overflow-hidden">
                <Gamepad2 className="w-12 h-12 text-[var(--border)] group-hover:text-[var(--primary)] group-hover:scale-110 transition-all" />
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={statusColors[game.status as keyof typeof statusColors]}
                    size="sm"
                    dot
                    pulse={game.status === 'working'}
                  >
                    {statusLabels[game.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </div>

              {/* Game Info */}
              <div className="p-4">
                <h3 className="font-semibold text-[var(--text)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                  {game.name}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-3 line-clamp-2">
                  {game.description}
                </p>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{game.users}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{game.rating}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
