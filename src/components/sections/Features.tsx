'use client';

import { Container } from '../layout/Container';
import { Section, SectionHeader } from '../layout/Section';
import { Card } from '../ui/Card';
import { IconBox } from '../ui/Icon';
import { 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Search, 
  Heart, 
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Completely Free',
    description: 'Get access to all scripts and features without paying anything or through our accessible key system.',
    variant: 'primary' as const,
  },
  {
    icon: TrendingUp,
    title: 'Always Improving',
    description: 'Our scripts are constantly updated to add new features and stay ahead of game changes.',
    variant: 'primary' as const,
  },
  {
    icon: Zap,
    title: 'Fast Updates',
    description: 'We ensure our scripts work after every game update with rapid patches and fixes.',
    variant: 'primary' as const,
  },
  {
    icon: Search,
    title: 'Powerful Automation',
    description: 'Our scripts handle the grind for you with intelligent automation and optimized performance.',
    variant: 'primary' as const,
  },
  {
    icon: Heart,
    title: 'Community Support',
    description: 'Need help? Join our Discord Server for fast and friendly support from staffs.',
    variant: 'primary' as const,
  },
  {
    icon: Shield,
    title: 'Safe to Use',
    description: 'Designed to be reliable and keep your account safe while you play.',
    variant: 'primary' as const,
  },
];

export function Features() {
  return (
    <Section className="relative">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary)] opacity-5 blur-[200px] rounded-full" />
      </div>

      <Container className="relative z-10">
        <SectionHeader
          title="Why use sixsense?"
          subtitle="Experience the best Roblox scripts with features designed for gamers like you."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={i}
                hover
                className="group"
              >
                <IconBox
                  icon={<Icon className="w-5 h-5" />}
                  variant={feature.variant}
                  className="mb-4 group-hover:scale-110 transition-transform"
                />
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

export default Features;
