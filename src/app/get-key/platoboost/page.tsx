'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Key, ExternalLink, CheckCircle, Loader2, AlertCircle, Shield, Clipboard } from 'lucide-react';

type FlowStep = 'start' | 'link_ready' | 'completed';

function PlatoboostContent() {
  const searchParams = useSearchParams();
  const discord_id = searchParams.get('discord_id');
  
  const [step, setStep] = useState<FlowStep>('start');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [offerUrl, setOfferUrl] = useState<string | null>(null);
  const [userKey, setUserKey] = useState('');
  const [gameKey, setGameKey] = useState<string | null>(null);

  const handleGetLink = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/platoboost/get-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discord_id: discord_id || null })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to get offer link');
        return;
      }

      setSessionId(data.session_id);
      setOfferUrl(data.offer_url);
      sessionStorage.setItem('platoboost_session_id', data.session_id);
      
      window.open(data.offer_url, '_blank', 'noopener,noreferrer');
      setStep('link_ready');

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKey = async () => {
    if (!userKey.trim()) {
      setError('Please enter your Platoboost key');
      return;
    }

    if (!sessionId) {
      setError('Session expired. Please get a new link.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/platoboost/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          key: userKey.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Key verification failed');
        return;
      }

      setGameKey(data.game_key);
      setStep('completed');

    } catch (err: any) {
      setError(err.message || 'Failed to verify key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (gameKey) {
      navigator.clipboard.writeText(gameKey);
    }
  };

  if (step === 'completed' && gameKey) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text)] mb-1">Key Ready!</h1>
              <p className="text-sm text-[var(--text-secondary)]">Your SIXSENSE key has been generated</p>
            </div>
            <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] p-4 mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-2">Your Game Key:</p>
              <p className="text-lg text-[var(--text)] font-mono tracking-wide break-all">{gameKey}</p>
            </div>
            <Button onClick={handleCopyKey} variant="primary" size="lg" fullWidth rightIcon={<Clipboard className="w-4 h-4" />}>
              Copy Key
            </Button>
            <p className="text-center text-xs text-[var(--text-muted)] mt-3">Valid for 24 hours</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'link_ready') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-[var(--primary-glow)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--text)] mb-1">Complete Offers</h1>
              <p className="text-sm text-[var(--text-secondary)]">Complete tasks on Platoboost to get your key</p>
            </div>
            {offerUrl && (
              <div className="mb-4">
                <Button onClick={() => window.open(offerUrl, '_blank')} variant="secondary" size="sm" fullWidth rightIcon={<ExternalLink className="w-4 h-4" />}>
                  Re-open Platoboost Link
                </Button>
              </div>
            )}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[var(--radius-sm)] p-3 mb-4">
              <p className="text-xs text-blue-300"><strong>After completing offers:</strong> Platoboost will show you a key. Copy that key and paste it below.</p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-sm)]">
                <p className="text-red-300 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)] mb-1 block">Platoboost Key</label>
                <input
                  type="text"
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value)}
                  placeholder="Paste your key here"
                  className="w-full bg-[var(--background-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <Button onClick={handleVerifyKey} disabled={loading || !userKey.trim()} variant="primary" size="lg" fullWidth isLoading={loading} rightIcon={!loading ? <Key className="w-4 h-4" /> : undefined}>
                {loading ? 'Verifying...' : 'Verify & Get Game Key'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[var(--primary-glow)] rounded-[var(--radius-sm)] flex items-center justify-center mx-auto mb-3">
            <Key className="w-7 h-7 text-[var(--primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Get Free Key</h1>
          <p className="text-sm text-[var(--text-secondary)]">Complete offers via Platoboost • 100% Free</p>
        </div>
        <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          {error && (
            <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-sm)]">
              <p className="text-red-300 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>
            </div>
          )}
          <div className="space-y-2 mb-5">
            {[1,2,3,4].map((n, i) => {
              const texts = [
                'Click button to get Platoboost link',
                'Complete offers (2-5 min)',
                'Copy key from Platoboost',
                'Paste key & get game key!'
              ];
              return (
                <div key={n} className="flex gap-2 items-center text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-black flex items-center justify-center font-bold flex-shrink-0 text-xs">{n}</div>
                  <p className="text-[var(--text-secondary)]">{texts[i]}</p>
                </div>
              );
            })}
          </div>
          <Button onClick={handleGetLink} disabled={loading} variant="primary" size="lg" fullWidth isLoading={loading} rightIcon={!loading ? <ExternalLink className="w-4 h-4" /> : undefined}>
            {loading ? 'Generating Link...' : 'Get Platoboost Link'}
          </Button>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Shield className="w-3.5 h-3.5" />
              <span>Powered by Platoboost • Supports LootLabs, Linkvertise, Work.ink</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlatoboostPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <PlatoboostContent />
    </Suspense>
  );
}
