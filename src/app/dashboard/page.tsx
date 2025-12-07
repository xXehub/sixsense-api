'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageBackground } from '@/components/ui/PageBackground';
import { useToast } from '@/components/ui/Toast';
import { 
  Key, 
  Shield, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  Gamepad2,
  Calendar,
  Zap,
  Link2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface UserKey {
  id: string;
  key: string;
  hwid: string | null;
  is_premium: boolean;
  expires_at: string | null;
  created_at: string;
  last_used: string | null;
  game: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface UserStats {
  total_keys: number;
  active_keys: number;
  premium_keys: number;
  linked_hwids: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<UserKey[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/user/keys');
      if (!response.ok) throw new Error('Failed to fetch keys');
      const data = await response.json();
      setKeys(data.keys || []);
      setStats(data.stats || null);
    } catch (err) {
      setError('Gagal memuat data. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncKeys = async () => {
    try {
      setSyncing(true);
      setError(null);
      const response = await fetch('/api/user/sync', { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');
      await fetchUserData();
    } catch (err) {
      setError('Gagal sync keys. Silakan coba lagi.');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 'Lifetime';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageBackground variant="subtle" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 relative">
      <PageBackground variant="subtle" />
      <Container className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={64}
                height={64}
                className="rounded-full ring-2 ring-primary/50"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome, {session.user?.name}
              </h1>
              <p className="text-muted text-sm">
                Discord ID: {session.user?.id}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={syncKeys}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Keys'}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card variant="default" className="text-center">
            <CardContent className="pt-6">
              <Key className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats?.total_keys || 0}</p>
              <p className="text-sm text-muted">Total Keys</p>
            </CardContent>
          </Card>
          <Card variant="default" className="text-center">
            <CardContent className="pt-6">
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats?.active_keys || 0}</p>
              <p className="text-sm text-muted">Active Keys</p>
            </CardContent>
          </Card>
          <Card variant="default" className="text-center">
            <CardContent className="pt-6">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats?.premium_keys || 0}</p>
              <p className="text-sm text-muted">Premium Keys</p>
            </CardContent>
          </Card>
          <Card variant="default" className="text-center">
            <CardContent className="pt-6">
              <Link2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{stats?.linked_hwids || 0}</p>
              <p className="text-sm text-muted">Linked HWIDs</p>
            </CardContent>
          </Card>
        </div>

        {/* Keys Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Keys</h2>
            <Badge variant="secondary">{keys.length} Keys</Badge>
          </div>

          {keys.length === 0 ? (
            <Card variant="default" className="text-center py-12">
              <CardContent>
                <Key className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Keys Found</h3>
                <p className="text-muted mb-4">
                  Kamu belum memiliki key yang terhubung dengan akun Discord ini.
                </p>
                <Button variant="primary" onClick={syncKeys} disabled={syncing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  Sync Keys dari HWID
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {keys.map((key) => (
                <Card 
                  key={key.id} 
                  variant={key.is_premium ? 'glow' : 'default'}
                  className={`relative overflow-hidden ${isExpired(key.expires_at) ? 'opacity-60' : ''}`}
                >
                  {key.is_premium && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-500/20 to-transparent px-4 py-1">
                      <span className="text-xs font-medium text-yellow-500">PREMIUM</span>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Key Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Key className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <code className="text-sm font-mono text-foreground bg-background-lighter px-3 py-1 rounded">
                              {key.key}
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.key)}
                              className="ml-2 p-1 hover:bg-background-lighter rounded transition-colors"
                            >
                              {copiedKey === key.key ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          {key.game && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Gamepad2 className="w-4 h-4" />
                              <span>{key.game.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {formatDate(key.created_at)}</span>
                          </div>
                          {key.last_used && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Clock className="w-4 h-4" />
                              <span>Last used: {formatDate(key.last_used)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Expiry */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted mb-1">Time Remaining</p>
                          <p className={`text-lg font-semibold ${
                            isExpired(key.expires_at) ? 'text-red-500' : 'text-primary'
                          }`}>
                            {getTimeRemaining(key.expires_at)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            isExpired(key.expires_at) ? 'error' : 
                            key.hwid ? 'success' : 'warning'
                          }
                        >
                          {isExpired(key.expires_at) ? 'Expired' : 
                           key.hwid ? 'Linked' : 'Unlinked'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Card variant="default" hover>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Key className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Get New Key</h3>
                  <p className="text-sm text-muted mb-3">
                    Dapatkan key baru untuk game yang tersedia.
                  </p>
                  <Button variant="primary" size="sm">
                    Get Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" hover>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-yellow-500/10 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Upgrade to Premium</h3>
                  <p className="text-sm text-muted mb-3">
                    Nikmati fitur premium tanpa batas waktu.
                  </p>
                  <Button variant="secondary" size="sm">
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
