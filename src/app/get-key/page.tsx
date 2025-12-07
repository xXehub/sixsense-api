'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Key, 
  Shield, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LogIn,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const keyPlans = [
  {
    id: 'daily',
    name: 'Daily Key',
    duration: '24 Hours',
    description: 'Perfect for trying out our scripts',
    features: ['All basic scripts', 'HWID lock', '1 HWID reset'],
    price: 'Free',
    linkvertise: true,
    highlight: false
  },
  {
    id: 'weekly',
    name: 'Weekly Key',
    duration: '7 Days',
    description: 'Great for regular users',
    features: ['All basic scripts', 'HWID lock', '3 HWID resets', 'Priority support'],
    price: 'Free',
    linkvertise: true,
    highlight: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Key',
    duration: 'Forever',
    description: 'Best value for power users',
    features: ['All premium scripts', 'HWID lock', 'Unlimited resets', 'VIP support', 'Early access'],
    price: 'Premium',
    linkvertise: false,
    highlight: false
  }
];

export default function GetKeyPage() {
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  const handleGetKey = async (planId: string) => {
    const plan = keyPlans.find(p => p.id === planId);
    if (!plan) return;

    if (plan.linkvertise) {
      // For free plans, redirect to linkvertise
      setSelectedPlan(planId);
      setStep(2);
    } else {
      // For premium, redirect to premium page
      window.location.href = '/premium';
    }
  };

  const completeLinkvertise = async () => {
    if (!session) {
      signIn('discord');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key_type: selectedPlan,
          discord_id: session.user?.id || session.user?.discordId
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate key');
      }

      setGeneratedKey(data.key || data.data?.key);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetFlow = () => {
    setSelectedPlan(null);
    setGeneratedKey(null);
    setStep(1);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-4">GET KEY</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get Your <span className="text-primary">Access Key</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Choose your plan and get instant access to all sixsense scripts.
            Keys are bound to your HWID for security.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${step >= s ? 'bg-primary text-background' : 'bg-background-card text-muted'}
              `}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <>
            {/* Key Plans */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {keyPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  variant={plan.highlight ? 'glow' : 'default'}
                  className={`relative overflow-hidden ${plan.highlight ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 bg-primary py-1 text-center">
                      <span className="text-xs font-semibold text-background">MOST POPULAR</span>
                    </div>
                  )}
                  <CardContent className={`p-6 ${plan.highlight ? 'pt-10' : ''}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${plan.highlight ? 'bg-primary/20' : 'bg-background-lighter'}`}>
                        {plan.id === 'lifetime' ? (
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                        ) : (
                          <Key className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{plan.name}</h3>
                        <p className="text-sm text-muted">{plan.duration}</p>
                      </div>
                    </div>

                    <p className="text-muted text-sm mb-4">{plan.description}</p>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mb-4">
                      <span className={`text-2xl font-bold ${plan.price === 'Free' ? 'text-primary' : 'text-yellow-500'}`}>
                        {plan.price}
                      </span>
                      {plan.linkvertise && (
                        <span className="text-sm text-muted ml-2">via Linkvertise</span>
                      )}
                    </div>

                    <Button
                      variant={plan.highlight ? 'primary' : 'outline'}
                      fullWidth
                      onClick={() => handleGetKey(plan.id)}
                    >
                      {plan.linkvertise ? 'Get Free Key' : 'Go Premium'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="max-w-lg mx-auto">
            <Card variant="glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExternalLink className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Complete Linkvertise
                </h2>
                <p className="text-muted mb-6">
                  Complete the Linkvertise verification to get your {selectedPlan} key.
                  This helps support our development!
                </p>

                {!session ? (
                  <div className="space-y-4">
                    <p className="text-sm text-yellow-500">
                      Please login with Discord first to link your key.
                    </p>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => signIn('discord')}
                      leftIcon={<LogIn className="w-4 h-4" />}
                    >
                      Login with Discord
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => window.open('https://link-target.net/YOUR_LINKVERTISE_ID', '_blank')}
                      leftIcon={<ExternalLink className="w-4 h-4" />}
                    >
                      Open Linkvertise
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={completeLinkvertise}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Key...
                        </>
                      ) : (
                        <>
                          I've Completed Linkvertise
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                )}

                <button 
                  onClick={resetFlow}
                  className="mt-6 text-sm text-muted hover:text-foreground"
                >
                  ← Back to plans
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && generatedKey && (
          <div className="max-w-lg mx-auto">
            <Card variant="glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Key Generated!
                </h2>
                <p className="text-muted mb-6">
                  Your key has been generated and linked to your Discord account.
                </p>

                <div className="bg-background-lighter rounded-lg p-4 mb-6">
                  <p className="text-xs text-muted mb-2">Your Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-lg font-mono text-primary break-all">
                      {generatedKey}
                    </code>
                    <button
                      onClick={copyKey}
                      className="p-2 hover:bg-background-card rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-muted" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={resetFlow}
                  >
                    Get Another Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card variant="default">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">HWID Locked</h3>
                <p className="text-sm text-muted">
                  Keys are bound to your hardware for security.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card variant="default">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Instant Delivery</h3>
                <p className="text-sm text-muted">
                  Get your key immediately after verification.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card variant="default">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Discord Linked</h3>
                <p className="text-sm text-muted">
                  Keys are linked to your Discord account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
