'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { ADMIN_DISCORD_IDS } from '@/lib/admin';
import { 
  Users, 
  Key, 
  Gamepad2, 
  BarChart3,
  Plus,
  Trash2,
  Edit,
  Ban,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Crown,
  Shield,
  Settings,
  Activity
} from 'lucide-react';

type Tab = 'overview' | 'keys' | 'users' | 'games' | 'settings';

interface Stats {
  totalUsers: number;
  totalKeys: number;
  activeKeys: number;
  premiumKeys: number;
  totalGames: number;
  totalExecutions: number;
}

interface KeyData {
  id: string;
  key_value: string;
  user_id: string | null;
  hwid: string | null;
  key_type: string;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
  total_uses: number;
  user?: {
    discord_username: string;
  };
}

interface UserData {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
  is_banned: boolean;
  created_at: string;
  keys_count?: number;
}

interface GameData {
  id: string;
  place_id: number;
  game_name: string;
  script_version: string;
  is_active: boolean;
  total_executions: number;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [games, setGames] = useState<GameData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', description: '', variant: 'default', onConfirm: () => {} });
  
  const [generateKeyModal, setGenerateKeyModal] = useState(false);

  // Check admin access
  const isAdmin = session?.user?.id && ADMIN_DISCORD_IDS.includes(session.user.id);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard');
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } else if (activeTab === 'keys') {
        const res = await fetch('/api/admin/keys');
        if (res.ok) {
          const data = await res.json();
          setKeys(data.keys || []);
        }
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } else if (activeTab === 'games') {
        const res = await fetch('/api/admin/games');
        if (res.ok) {
          const data = await res.json();
          setGames(data.games || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      addToast('error', 'Failed to fetch data', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(text);
    addToast('success', 'Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleKeyAction = async (keyId: string, action: 'delete' | 'toggle' | 'reset-hwid') => {
    setActionLoading(keyId);
    try {
      const res = await fetch(`/api/admin/keys/${keyId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const actionLabels = { delete: 'deleted', toggle: 'toggled', 'reset-hwid': 'reset' };
        addToast('success', `Key ${actionLabels[action]}`, `The key has been ${actionLabels[action]} successfully`);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        addToast('error', 'Action failed', 'Please try again');
      }
    } catch (error) {
      console.error('Action failed:', error);
      addToast('error', 'Action failed', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserAction = async (userId: string, action: 'ban' | 'unban') => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        addToast('success', `User ${action === 'ban' ? 'banned' : 'unbanned'}`, 'Action completed successfully');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        addToast('error', 'Action failed', 'Please try again');
      }
    } catch (error) {
      console.error('Action failed:', error);
      addToast('error', 'Action failed', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGameAction = async (gameId: string, action: 'delete' | 'toggle') => {
    setActionLoading(gameId);
    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        addToast('success', `Game ${action === 'delete' ? 'deleted' : 'toggled'}`, 'Action completed successfully');
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        addToast('error', 'Action failed', 'Please try again');
      }
    } catch (error) {
      console.error('Action failed:', error);
      addToast('error', 'Action failed', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const generateKey = async (keyType: string) => {
    setActionLoading('generate');
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_type: keyType })
      });
      if (res.ok) {
        addToast('success', 'Key generated!', `${keyType} key created successfully`);
        setGenerateKeyModal(false);
        fetchData();
      } else {
        addToast('error', 'Generation failed', 'Could not generate key');
      }
    } catch (error) {
      console.error('Generate failed:', error);
      addToast('error', 'Generation failed', 'An error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading && !stats)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="default" className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'keys' as Tab, label: 'Keys', icon: Key },
    { id: 'users' as Tab, label: 'Users', icon: Users },
    { id: 'games' as Tab, label: 'Games', icon: Gamepad2 },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <Container>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-red-500/10 p-3 rounded-lg">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted text-sm">Manage keys, users, and games</p>
          </div>
          <Badge variant="error" className="ml-auto">ADMIN</Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap
                transition-all duration-200 border
                ${activeTab === tab.id
                  ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                  : 'bg-background-card text-muted border-border hover:text-foreground hover:border-border-hover'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid with new StatsCard component */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatsCard
                icon={Users}
                iconColor="text-blue-500"
                value={stats?.totalUsers || 0}
                label="Total Users"
              />
              <StatsCard
                icon={Key}
                iconColor="text-primary"
                value={stats?.totalKeys || 0}
                label="Total Keys"
              />
              <StatsCard
                icon={CheckCircle}
                iconColor="text-green-500"
                value={stats?.activeKeys || 0}
                label="Active Keys"
              />
              <StatsCard
                icon={Crown}
                iconColor="text-yellow-500"
                value={stats?.premiumKeys || 0}
                label="Premium Keys"
              />
              <StatsCard
                icon={Gamepad2}
                iconColor="text-purple-500"
                value={stats?.totalGames || 0}
                label="Games"
              />
              <StatsCard
                icon={Activity}
                iconColor="text-orange-500"
                value={stats?.totalExecutions || 0}
                label="Executions"
              />
            </div>

            {/* Quick Actions */}
            <Card variant="default">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="primary" size="sm" onClick={() => generateKey('daily')} disabled={actionLoading === 'generate'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Daily Key
                </Button>
                <Button variant="secondary" size="sm" onClick={() => generateKey('weekly')} disabled={actionLoading === 'generate'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Weekly Key
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateKey('lifetime')} disabled={actionLoading === 'generate'}>
                  <Crown className="w-4 h-4 mr-2" />
                  Generate Lifetime Key
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm" onClick={() => setGenerateKeyModal(true)} disabled={actionLoading === 'generate'}>
                <Plus className="w-4 h-4 mr-2" />
                New Key
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {keys
                  .filter(k => k.key_value.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((key) => (
                    <Card key={key.id} variant="default" className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono text-foreground">{key.key_value}</code>
                            <button onClick={() => copyToClipboard(key.key_value)} className="p-1 hover:bg-background-lighter rounded">
                              {copiedKey === key.key_value ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted" />}
                            </button>
                            <Badge variant={key.key_type === 'lifetime' ? 'warning' : 'default'} className="text-xs">
                              {key.key_type}
                            </Badge>
                            <Badge variant={key.is_active ? 'success' : 'error'} className="text-xs">
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted">
                            <span>Uses: {key.total_uses}</span>
                            {key.hwid && <span>HWID: {key.hwid.slice(0, 8)}...</span>}
                            {key.user?.discord_username && <span>User: {key.user.discord_username}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleKeyAction(key.id, 'reset-hwid')}
                            disabled={actionLoading === key.id}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleKeyAction(key.id, 'toggle')}
                            disabled={actionLoading === key.id}
                          >
                            {key.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleKeyAction(key.id, 'delete')}
                            disabled={actionLoading === key.id}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="mb-4">
              <SearchInput
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {users
                  .filter(u => u.discord_username?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((user) => (
                    <Card key={user.id} variant="default" hover className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{user.discord_username || 'Unknown'}</span>
                            {user.is_banned && <Badge variant="error">Banned</Badge>}
                          </div>
                          <p className="text-xs text-muted">ID: {user.discord_id}</p>
                        </div>
                        <Button
                          variant={user.is_banned ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleUserAction(user.id, user.is_banned ? 'unban' : 'ban')}
                          disabled={actionLoading === user.id}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          {user.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Game
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {games
                  .filter(g => g.game_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((game) => (
                    <Card key={game.id} variant="default" hover className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                          <Gamepad2 className="w-7 h-7 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{game.game_name}</span>
                            <Badge variant={game.is_active ? 'success' : 'error'} className="text-xs">
                              {game.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted mb-3">
                            Place ID: {game.place_id} • v{game.script_version} • {game.total_executions.toLocaleString()} executions
                          </p>
                          <div className="flex gap-2">
                            <Tooltip content={game.is_active ? 'Deactivate' : 'Activate'}>
                              <Button variant="ghost" size="sm" onClick={() => handleGameAction(game.id, 'toggle')}>
                                {game.is_active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                              </Button>
                            </Tooltip>
                            <Tooltip content="Edit game">
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Delete game">
                              <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => handleGameAction(game.id, 'delete')}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Admin Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Settings}
                title="Settings coming soon"
                description="Admin configuration options will be available here"
              />
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Generate Key Modal */}
      <Modal
        isOpen={generateKeyModal}
        onClose={() => setGenerateKeyModal(false)}
        title="Generate New Key"
        description="Select the type of key you want to generate"
        size="sm"
      >
        <div className="space-y-3">
          <button
            onClick={() => generateKey('daily')}
            disabled={actionLoading === 'generate'}
            className="w-full p-4 rounded-xl border border-border bg-background-card hover:bg-background-card-hover hover:border-border-hover transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Daily Key</p>
                <p className="text-xs text-muted">Expires in 24 hours</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => generateKey('weekly')}
            disabled={actionLoading === 'generate'}
            className="w-full p-4 rounded-xl border border-border bg-background-card hover:bg-background-card-hover hover:border-border-hover transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Weekly Key</p>
                <p className="text-xs text-muted">Expires in 7 days</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => generateKey('lifetime')}
            disabled={actionLoading === 'generate'}
            className="w-full p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">Lifetime Key</p>
                <p className="text-xs text-muted">Never expires (Premium)</p>
              </div>
            </div>
          </button>
        </div>
        
        {actionLoading === 'generate' && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating key...
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText="Confirm"
        cancelText="Cancel"
        loading={!!actionLoading}
      />
    </div>
  );
}
