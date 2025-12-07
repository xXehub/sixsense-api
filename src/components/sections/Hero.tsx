'use client';

import Link from 'next/link';
import { Container } from '../layout/Container';
import { Button } from '../ui/Button';
import { Key, Code, ArrowRight, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] opacity-10 blur-[128px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)] opacity-10 blur-[128px] rounded-full" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--border) 1px, transparent 1px),
              linear-gradient(90deg, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 mb-8">
            <Zap className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--primary)]">
              Powerful Roblox Scripts
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-[var(--text)]">Dominate </span>
            <span className="text-gradient">Every Game</span>
            <br />
            <span className="text-[var(--text)]">with </span>
            <span className="text-gradient">sixsense</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Premium automation scripts for Roblox games. 
            Completely free, always updated, and built with performance in mind.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/get-key">
              <Button
                size="lg"
                leftIcon={<Key className="w-5 h-5" />}
                className="min-w-[180px]"
              >
                Get Your Key
              </Button>
            </Link>
            <Link href="/scripts">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Code className="w-5 h-5" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="min-w-[180px]"
              >
                View Scripts
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '15+', label: 'Supported Games' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-[var(--border)] flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-[var(--primary)] rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
