'use client';

import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageBackground } from '@/components/ui/PageBackground';
import { 
  Crown, 
  Check, 
  Zap, 
  Shield, 
  Clock, 
  Infinity,
  MessageCircle,
  Star,
  Rocket,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    period: '',
    description: 'Get started with basic features',
    features: [
      { text: 'Daily/Weekly keys via Linkvertise', included: true },
      { text: 'Basic scripts access', included: true },
      { text: '1 HWID reset per key', included: true },
      { text: 'Community support', included: true },
      { text: 'Premium scripts', included: false },
      { text: 'Priority support', included: false },
      { text: 'Early access', included: false },
    ],
    buttonText: 'Get Free Key',
    buttonVariant: 'outline' as const,
    href: '/get-key',
    highlight: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'Rp 25.000',
    period: '/lifetime',
    description: 'Best value for serious users',
    features: [
      { text: 'Lifetime key (never expires)', included: true },
      { text: 'All premium scripts', included: true },
      { text: 'Unlimited HWID resets', included: true },
      { text: 'Priority Discord support', included: true },
      { text: 'Early access to new scripts', included: true },
      { text: 'Exclusive Discord role', included: true },
      { text: 'Request custom features', included: true },
    ],
    buttonText: 'Get Premium',
    buttonVariant: 'primary' as const,
    href: 'https://discord.gg/sixsense',
    highlight: true
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 'Rp 50.000',
    period: '/lifetime',
    description: 'For the ultimate experience',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Private VIP scripts', included: true },
      { text: 'Personal 1-on-1 support', included: true },
      { text: 'Custom script requests', included: true },
      { text: 'Beta testing access', included: true },
      { text: 'VIP Discord channel', included: true },
      { text: 'Priority feature requests', included: true },
    ],
    buttonText: 'Contact for VIP',
    buttonVariant: 'secondary' as const,
    href: 'https://discord.gg/sixsense',
    highlight: false
  }
];

const features = [
  {
    icon: Infinity,
    title: 'Lifetime Access',
    description: 'Pay once, use forever. No recurring payments or renewals.'
  },
  {
    icon: Shield,
    title: 'Undetected Scripts',
    description: 'All scripts are regularly updated to stay undetected.'
  },
  {
    icon: Rocket,
    title: 'Early Access',
    description: 'Be the first to try new scripts and features.'
  },
  {
    icon: MessageCircle,
    title: 'Priority Support',
    description: 'Get help faster with dedicated support channels.'
  }
];

const testimonials = [
  {
    name: 'Radit',
    role: 'Premium User',
    content: 'Udah pake sixsense 6 bulan, gak pernah kena ban. Worth it banget!',
    rating: 5
  },
  {
    name: 'Aldi',
    role: 'VIP User',
    content: 'Script paling bagus yang pernah gue pake. Support nya juga fast response.',
    rating: 5
  },
  {
    name: 'Budi',
    role: 'Premium User',
    content: 'Fiturnya lengkap, updatenya cepet. Recommended!',
    rating: 5
  }
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium');

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 relative">
      <PageBackground variant="subtle" />
      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="warning" className="mb-4 gap-1">
            <Crown className="w-3 h-3" /> PREMIUM
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Upgrade to <span className="text-primary">Premium</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Unlock the full potential of sixsense with premium features,
            priority support, and exclusive scripts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              variant={plan.highlight ? 'default' : 'default'}
              className={`relative overflow-hidden transition-all duration-300 ${
                plan.highlight 
                  ? 'glow-premium md:scale-105 bg-premium-gradient' 
                  : 'hover:border-[var(--border-hover)]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-400 py-2 text-center">
                  <span className="text-sm font-semibold text-background flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" /> BEST VALUE
                  </span>
                </div>
              )}
              <CardContent className={`p-6 ${plan.highlight ? 'pt-12' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${plan.highlight ? 'text-amber-400 glow-premium-text' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                    <span className="text-muted text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-muted rounded-full" />
                        </div>
                      )}
                      <span className={feature.included ? 'text-foreground' : 'text-muted'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.buttonVariant}
                  fullWidth
                  onClick={() => window.open(plan.href, plan.href.startsWith('http') ? '_blank' : '_self')}
                >
                  {plan.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Why Go Premium?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} variant="default" hover>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            What Users Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} variant="default">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card variant="default">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Bagaimana cara pembayaran?</h3>
                <p className="text-muted">
                  Pembayaran dilakukan melalui Discord server kami. Kami menerima transfer bank, DANA, OVO, GoPay, dan pulsa.
                </p>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Apakah lifetime benar-benar selamanya?</h3>
                <p className="text-muted">
                  Ya! Key lifetime tidak pernah expire selama service kami masih berjalan. Tidak ada biaya perpanjangan.
                </p>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Apa itu HWID reset?</h3>
                <p className="text-muted">
                  HWID reset memungkinkan kamu untuk memindahkan key ke komputer lain. Premium user mendapat unlimited reset.
                </p>
              </CardContent>
            </Card>
            <Card variant="default">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Apakah script ini aman?</h3>
                <p className="text-muted">
                  Script kami di-update secara berkala untuk memastikan tetap undetected. Kami juga menggunakan obfuscation dan anti-detection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card variant="glow" className="mt-16">
          <CardContent className="p-8 md:p-12 text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Go Premium?
            </h2>
            <p className="text-muted mb-8 max-w-lg mx-auto">
              Join our Discord server to purchase premium and get instant access to all features!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.open('https://discord.gg/sixsense', '_blank')}
              leftIcon={<MessageCircle className="w-5 h-5" />}
            >
              Join Discord Server
            </Button>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
