'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageBackground } from '@/components/ui/PageBackground';
import { useToast } from '@/components/ui/Toast';
import { 
  Key, 
  Shield, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  LogIn,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Crown,
  Zap,
  Link2,
  Gift,
  Star
} from 'lucide-react';

// Free key providers with brand colors
const freeProviders = [
  {
    id: 'linkvertise',
    name: 'Linkvertise',
    description: 'Complete quick steps to get your key',
    color: 'linkvertise', // Orange brand color
    icon: Link2,
    url: 'https://link-target.net/YOUR_LINKVERTISE_ID',
    duration: '~2 minutes'
  },
  {
    id: 'lootlabs',
    name: 'Loot Labs',
    description: 'Alternative method with fewer steps',
    color: 'lootlabs', // Purple brand color
    icon: Gift,
    url: 'https://lootlabs.gg/YOUR_LOOTLABS_ID',
    duration: '~1 minute'
  },
  {
    id: 'workink',
    name: 'Work.ink',
    description: 'Simple and fast verification',
    color: 'workink', // Green brand color
    icon: Zap,
    url: 'https://work.ink/YOUR_WORKINK_ID',
    duration: '~1 minute'
  }
];

export default function GetKeyPage() {
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const handlePremium = () => {
    window.location.href = '/premium';
  };

  const handleFreeProvider = (providerId: string) => {
    if (!session) {
      addToast('warning', 'Login Required', 'Please login with Discord first');
      return;
    }
    setSelectedProvider(providerId);
    setStep(2);
  };

  const openProviderLink = () => {
    const provider = freeProviders.find(p => p.id === selectedProvider);
    if (provider) {
      window.open(provider.url, '_blank');
    }
  };

  const completeVerification = async () => {
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
          key_type: 'weekly',
          discord_id: session.user?.id || session.user?.discordId,
          provider: selectedProvider
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate key');
      }

      setGeneratedKey(data.key || data.data?.key);
      setStep(3);
      addToast('success', 'Key Generated!', 'Your key has been created successfully');
    } catch (err: any) {
      setError(err.message);
      addToast('error', 'Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    addToast('success', 'Copied!', 'Key copied to clipboard');
  };

  const resetFlow = () => {
    setSelectedProvider(null);
    setGeneratedKey(null);
    setStep(1);
    setError(null);
  };

  const getProviderColorClass = (color: string) => {
    switch (color) {
      case 'linkvertise': return 'text-orange-500 bg-orange-500/10 border-orange-500/30'; // Linkvertise orange
      case 'lootlabs': return 'text-violet-500 bg-violet-500/10 border-violet-500/30'; // Lootlabs purple
      case 'workink': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'; // Workink green
      default: return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  const getProviderHoverClass = (color: string) => {
    switch (color) {
      case 'linkvertise': return 'hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]';
      case 'lootlabs': return 'hover:border-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]';
      case 'workink': return 'hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      default: return 'hover:border-[var(--primary)]';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 relative">
      <PageBackground variant="subtle" />
      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-4">GET KEY</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get Your <span className="text-primary">Access Key</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Choose Premium for lifetime access or get free keys through our partners.
            Keys are bound to your HWID for security.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                ${step > s 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : step === s 
                    ? 'bg-primary border-primary text-background shadow-[0_0_15px_rgba(74,222,128,0.4)]' 
                    : 'bg-background-card/50 border-border text-muted'
                }
              `}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 transition-colors duration-300 ${step > s ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Method */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Premium Option - Highlighted */}
            <div className="max-w-4xl mx-auto">
              <Card 
                variant="default"
                className="glow-premium bg-premium-gradient overflow-hidden relative"
              >
                {/* Premium Shine Effect */}
                <div className="absolute inset-0 premium-shine pointer-events-none" />
                
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-400 py-1.5 text-center">
                  <span className="text-xs font-semibold text-background flex items-center justify-center gap-1">
                    <Star className="w-3 h-3" /> RECOMMENDED
                  </span>
                </div>

                <CardContent className="p-6 pt-10 relative">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown className="w-8 h-8 text-background" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                        <Badge variant="warning" size="sm">LIFETIME ACCESS</Badge>
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-1">
                        Go <span className="text-amber-400 glow-premium-text">Premium</span>
                      </h2>
                      <p className="text-muted text-sm mb-3">
                        Pay once, use forever. All premium scripts, unlimited HWID resets, priority support.
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3 justify-center md:justify-start">
                        <span className="flex items-center gap-1 text-xs text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> All Scripts
                        </span>
                        <span className="flex items-center gap-1 text-xs text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Unlimited Resets
                        </span>
                        <span className="flex items-center gap-1 text-xs text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Priority Support
                        </span>
                      </div>
                    </div>

                    {/* Price & Button */}
                    <div className="flex flex-col items-center md:items-end gap-2 flex-shrink-0">
                      <div className="text-2xl font-bold text-amber-400">
                        Rp 25.000
                        <span className="text-sm font-normal text-muted">/lifetime</span>
                      </div>
                      <Button
                        variant="primary"
                        onClick={handlePremium}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-background border-0"
                      >
                        Get Premium
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 max-w-4xl mx-auto">
              <div className="flex-1 h-px bg-border" />
              <span className="text-muted text-sm">Or get a free key</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Free Options */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {freeProviders.map((provider) => (
                <Card 
                  key={provider.id}
                  variant="default"
                  className={`group cursor-pointer transition-all duration-300 hover:-translate-y-1 ${getProviderHoverClass(provider.color)}`}
                  onClick={() => handleFreeProvider(provider.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2.5 rounded-lg border ${getProviderColorClass(provider.color)}`}>
                        <provider.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{provider.name}</h3>
                        <p className="text-xs text-muted">{provider.duration}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted mb-4">{provider.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Free</Badge>
                      <ArrowRight className={`w-4 h-4 text-muted transition-colors ${
                        provider.color === 'linkvertise' ? 'group-hover:text-orange-500' :
                        provider.color === 'lootlabs' ? 'group-hover:text-violet-500' :
                        provider.color === 'workink' ? 'group-hover:text-emerald-500' :
                        'group-hover:text-primary'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Login Reminder */}
            {!session && (
              <div className="max-w-xl mx-auto">
                <Card variant="default">
                  <CardContent className="p-4 flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-sm text-muted flex-1">
                      Login with Discord to get your key linked to your account.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signIn('discord')}
                      leftIcon={<LogIn className="w-4 h-4" />}
                    >
                      Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Complete Verification */}
        {step === 2 && selectedProvider && (
          <div className="max-w-lg mx-auto">
            <Card variant="glow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExternalLink className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Complete {freeProviders.find(p => p.id === selectedProvider)?.name}
                </h2>
                <p className="text-muted mb-6">
                  Complete the verification to get your weekly key.
                  This helps support our development!
                </p>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={openProviderLink}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Open {freeProviders.find(p => p.id === selectedProvider)?.name}
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={completeVerification}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Key...
                      </>
                    ) : (
                      <>
                        I've Completed Verification
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">{error}</span>
                  </div>
                )}

                <button 
                  onClick={resetFlow}
                  className="mt-6 text-sm text-muted hover:text-foreground transition-colors"
                >
                  ← Back to options
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Key Generated */}
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
                      title="Copy key"
                    >
                      <Copy className="w-5 h-5 text-muted hover:text-foreground" />
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
        {/* <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card variant="default" hover>
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
          <Card variant="default" hover>
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
          <Card variant="default" hover>
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
        </div> */}
      </Container>
    </div>
  );
}
