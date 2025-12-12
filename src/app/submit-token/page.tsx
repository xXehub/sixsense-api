'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Key, Copy, CheckCircle, Loader2, AlertCircle, Home, ExternalLink } from 'lucide-react';

function SubmitTokenContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const srParam = searchParams.get('sr');
  
  const [sessionId, setSessionId] = useState<string>('');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sid = srParam || sessionStorage.getItem('workink_session_id') || '';
    setSessionId(sid);

    if (!sid) {
      setError('No session found. Please start from the beginning.');
      setStatus('error');
      return;
    }

    // Auto verify - check if Work.ink token was submitted
    verifySession(sid);
  }, [srParam]);

  const verifySession = async (sid: string) => {
    try {
      // Check session status
      const response = await fetch(`/api/workink/check-session?session_id=${sid}`);
      const data = await response.json();

      if (data.success && data.key) {
        setKey(data.key);
        setStatus('success');
        sessionStorage.removeItem('workink_session_id');
      } else if (data.pending) {
        // Still waiting for user to complete offer
        setError('Please complete the offer on Work.ink first');
        setStatus('error');
      } else {
        setError(data.error || 'Verification failed');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStatus('error');
    }
  };

  const handleCopy = () => {
    if (key) {
      navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SUCCESS STATE
  if (status === 'success' && key) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle className="w-7 h-7 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
              Success!
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Your key is ready
            </p>
          </div>

          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                YOUR KEY:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="w-full px-3 py-2.5 bg-[var(--background-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text)] font-mono text-sm text-center focus:outline-none focus:border-[var(--primary)] select-all"
                />
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] p-2.5 text-center">
                <p className="text-xs text-[var(--text-muted)]">Valid For</p>
                <p className="text-sm font-bold text-[var(--primary)]">24h</p>
              </div>
              <div className="bg-[var(--background-elevated)] border border-[var(--border)] rounded-[var(--radius-sm)] p-2.5 text-center">
                <p className="text-xs text-[var(--text-muted)]">Status</p>
                <p className="text-sm font-bold text-[var(--success)]">Active</p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-[var(--radius-sm)] p-3 mb-4">
              <p className="text-xs text-blue-300 mb-2"><strong>How to use:</strong></p>
              <ol className="text-xs text-blue-200 space-y-1">
                <li>1. Execute loader script</li>
                <li>2. Paste your key when prompted</li>
                <li>3. Enjoy!</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => router.push('/get-key/workink')}
                variant="secondary"
                size="sm"
                fullWidth
              >
                Get Another
              </Button>
              <Button
                onClick={handleCopy}
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy Key'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-5">
            <div className="w-14 h-14 bg-[var(--error)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-[var(--error)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
              Verification Failed
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {error || 'Something went wrong'}
            </p>
          </div>

          <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
            <div className="bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[var(--radius-sm)] p-3 mb-4">
              <p className="text-sm text-red-300">
                {error || 'Unable to verify your session'}
              </p>
            </div>

            <div className="space-y-2 mb-4 text-sm text-[var(--text-secondary)]">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                Make sure you completed the offer
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                Session may have expired (15 min limit)
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                Try starting again
              </p>
            </div>

            <Button
              onClick={() => router.push('/get-key/workink')}
              variant="primary"
              size="md"
              fullWidth
              rightIcon={<Home className="w-4 h-4" />}
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VERIFYING STATE (loading)
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-[var(--primary-glow)] rounded-full flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-1">
            Verifying...
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Checking your session
          </p>
        </div>

        <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--text-secondary)]">Checking session...</span>
              <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
            </div>
            <div className="flex items-center justify-between py-2 opacity-50">
              <span className="text-sm text-[var(--text-secondary)]">Verifying token...</span>
              <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]"></div>
            </div>
            <div className="flex items-center justify-between py-2 opacity-50">
              <span className="text-sm text-[var(--text-secondary)]">Generating key...</span>
              <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]"></div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] text-center">
              Please wait, this may take a few seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitTokenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <SubmitTokenContent />
    </Suspense>
  );
}
