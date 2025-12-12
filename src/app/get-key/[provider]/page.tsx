'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { PageBackground } from '@/components/ui/PageBackground';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Clock,
  Zap,
  Link2,
  Gift,
  Key,
  Timer
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
  duration: number;
  isPremium: boolean;
}

interface SessionData {
  sessionId: string;
  status: 'pending' | 'started' | 'completed' | 'expired';
  key?: string;
  expiresAt?: string;
}

const providerIconMap: Record<string, React.ComponentType<any>> = {
  linkvertise: Link2,
  lootlabs: Gift,
  workink: Zap,
};

export default function GetKeyProviderPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { addToast } = useToast();
  
  const providerId = params?.provider as string;
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [progress, setProgress] = useState(0);
  const [checking, setChecking] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch provider details
  const fetchProvider = useCallback(async () => {
    try {
      const res = await fetch(`/api/key-providers?type=free`);
      const data = await res.json();
      
      if (data.success) {
        const found = data.data.find((p: Provider) => p.id === providerId);
        if (found) {
          setProvider(found);
        } else {
          setError('Provider not found');
        }
      }
    } catch (err) {
      setError('Failed to load provider');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Create session
  const createSession = useCallback(async () => {
    if (!session) return;
    
    try {
      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerId,
          discord_id: (session.user as any)?.id || (session.user as any)?.discordId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setSessionData(data.session);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }, [session, providerId]);

  // Check session status
  const checkSessionStatus = useCallback(async () => {
    if (!sessionData?.sessionId) return;
    
    setChecking(true);
    try {
      const res = await fetch(`/api/session/status?id=${sessionData.sessionId}`);
      const data = await res.json();
      
      if (data.success) {
        setSessionData(data.session);
        
        if (data.session.status === 'completed') {
          // Stop polling
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          // Set key if available
          if (data.session.key) {
            setGeneratedKey(data.session.key);
            setProgress(100);
            addToast('Key generated successfully! 🎉', 'success');
          }
        } else if (data.session.status === 'started') {
          // Update progress animation
          setProgress(prev => Math.min(prev + 5, 90));
        }
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setChecking(false);
    }
  }, [sessionData, addToast]);

  // Start progress checking
  const startProgressCheck = useCallback(() => {
    if (pollIntervalRef.current) return;
    
    setProgress(10);
    pollIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 5000); // Poll every 5 seconds
    
    // Initial check
    checkSessionStatus();
  }, [checkSessionStatus]);

  // Open provider link
  const handleStart = async () => {
    if (!provider || !sessionData) return;
    
    // Build redirect URL with session
    const redirectUrl = `/api/redirect/${providerId}?session=${sessionData.sessionId}`;
    
    // Open in new tab
    window.open(redirectUrl, '_blank');
    
    // Update session status to started
    try {
      await fetch('/api/session/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          status: 'started'
        })
      });
      
      setSessionData(prev => prev ? { ...prev, status: 'started' } : null);
      
      // Start polling for completion
      startProgressCheck();
      
      addToast('Link opened! Complete the offer and submit the token to get your key.', 'info');
    } catch (err) {
      addToast('Failed to update session', 'error');
    }
  };

  // Copy key
  const copyKey = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    addToast('Key copied to clipboard!', 'success');
  };

  // Initialize
  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  useEffect(() => {
    if (provider && session && !sessionData) {
      createSession();
    }
  }, [provider, session, sessionData, createSession]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Get provider icon
  const renderProviderIcon = () => {
    if (!provider) return null;
    const IconComponent = providerIconMap[provider.id];
    if (IconComponent) {
      return <IconComponent className="w-8 h-8" />;
    }
    return <span className="text-3xl">{provider.icon || '🔗'}</span>;
  };

  const getColorHex = (color: string): string => {
    if (color.startsWith('#')) return color;
    switch (color) {
      case 'linkvertise': return '#f97316';
      case 'lootlabs': return '#8b5cf6';
      case 'workink': return '#10b981';
      default: return '#4ade80';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 relative">
        <PageBackground variant="subtle" />
        <Container className="relative z-10">
          <div className="max-w-lg mx-auto text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Provider Not Found</h1>
            <p className="text-muted mb-6">{error || 'The requested provider does not exist or is not active.'}</p>
            <Button onClick={() => router.push('/get-key')}>
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Get Key
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const colorHex = getColorHex(provider.color);
  const isCompleted = sessionData?.status === 'completed' && generatedKey;
  const isStarted = sessionData?.status === 'started';

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 relative">
      <PageBackground variant="subtle" />
      <Container className="relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/get-key')}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span className="text-sm">Back to options</span>
          </button>

          {/* Main Card - Luarmor Style */}
          <div 
            className="rounded-2xl border overflow-hidden bg-background-card"
            style={{ borderColor: `${colorHex}30` }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: `${colorHex}10`,
                borderColor: `${colorHex}20`
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center border"
                  style={{
                    backgroundColor: `${colorHex}20`,
                    borderColor: `${colorHex}50`,
                    color: colorHex
                  }}
                >
                  {renderProviderIcon()}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground">{provider.name}</h1>
                  <p className="text-sm text-muted">{provider.description}</p>
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {(isStarted || isCompleted) && (
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted">Progress</span>
                  <span className="text-sm font-medium text-foreground">{progress}%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: isCompleted ? '#22c55e' : colorHex
                    }}
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {!isStarted && !isCompleted && (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Ready to Get Your Key?
                    </h3>
                    <p className="text-sm text-muted">
                      Click START below to begin. You'll be redirected to complete a quick offer.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-background border border-border">
                      <Clock className="w-5 h-5 mx-auto mb-2 text-muted" />
                      <p className="text-xs text-muted">Duration</p>
                      <p className="text-sm font-medium text-foreground">{provider.duration} day{provider.duration > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background border border-border">
                      <Timer className="w-5 h-5 mx-auto mb-2 text-muted" />
                      <p className="text-xs text-muted">Time</p>
                      <p className="text-sm font-medium text-foreground">~2 mins</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background border border-border">
                      <Key className="w-5 h-5 mx-auto mb-2 text-muted" />
                      <p className="text-xs text-muted">Type</p>
                      <p className="text-sm font-medium text-foreground">Free</p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleStart}
                    disabled={!sessionData}
                    className="h-14 text-lg"
                    style={{
                      backgroundColor: colorHex,
                      borderColor: colorHex
                    }}
                  >
                    {!sessionData ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5 mr-2" />
                        START
                      </>
                    )}
                  </Button>
                </>
              )}

              {isStarted && !isCompleted && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Waiting for Completion...
                    </h3>
                    <p className="text-sm text-muted mb-4">
                      Complete the offer in the opened window. Your progress is being tracked automatically.
                    </p>
                    {checking && (
                      <p className="text-xs text-primary flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking status...
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={handleStart}
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link Again
                    </Button>
                    <div className="text-center">
                      <p className="text-xs text-muted">
                        Status updates automatically every 5 seconds
                      </p>
                    </div>
                  </div>
                </>
              )}

              {isCompleted && generatedKey && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Key Generated Successfully! 🎉
                    </h3>
                    <p className="text-sm text-muted">
                      Your key has been generated and is ready to use.
                    </p>
                  </div>

                  <div className="bg-background rounded-lg p-4 border border-border mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted uppercase tracking-wide">Your Key</span>
                      <button
                        onClick={copyKey}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <code className="text-base font-mono text-primary break-all block">
                      {generatedKey}
                    </code>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={copyKey}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => router.push('/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted">
              Keys are automatically tracked and generated after completion.
              <br />
              No manual verification needed.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
