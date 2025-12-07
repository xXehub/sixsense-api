'use client';

import Link from 'next/link';
import { Container } from '../layout/Container';
import { Section } from '../layout/Section';
import { Button } from '../ui/Button';
import { MessageCircle, Zap } from 'lucide-react';

export function CTA() {
  return (
    <Section padding="xl" className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--primary)]/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--primary)] opacity-10 blur-[150px] rounded-full" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4">
            Ready to <span className="text-gradient">dominate</span>?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            Join thousands of players using sixsense to enhance their Roblox experience.
            Get started for free today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/get-key">
              <Button
                size="lg"
                leftIcon={<Zap className="w-5 h-5" />}
                className="min-w-[180px]"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="https://discord.gg/sixsense" target="_blank">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<MessageCircle className="w-5 h-5" />}
                className="min-w-[180px]"
              >
                Join Discord
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default CTA;
