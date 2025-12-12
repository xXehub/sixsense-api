'use client';

import { useState, useEffect } from 'react';
import { 
  Key, Plus, Search, Filter, Download, Copy, Check,
  Trash2, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Clock, XCircle, Loader2
} from 'lucide-react';

interface LicenseKey {
  id: string;
  key_value: string;
  key_type: string;
  is_active: boolean;
  hwid: string | null;
  user_id: string | null;
  users?: {
    discord_id: string;
    discord_username: string;
  };
  created_at: string;
  expires_at: string | null;
  total_uses: number;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalKeys, setTotalKeys] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<LicenseKey | null>(null);

  // Fetch keys from API
  const fetchKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/keys?limit=100&offset=0`);
      if (!res.ok) {
        throw new Error('Failed to fetch keys');
      }
      const data = await res.json();
      if (data.success && data.keys) {
        setKeys(data.keys);
        setTotalKeys(data.total || data.keys.length);
      } else {
        throw new Error(data.error || 'Failed to fetch keys');
      }
    } catch (err) {
      console.error('Error fetching keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch keys');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleDeleteKey = async (keyId: string, keyValue: string) => {
    if (!confirm(`Are you sure you want to delete key "${keyValue}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/keys/${keyId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete key');
      }
      
      await fetchKeys();
    } catch (err) {
      console.error('Delete key error:', err);
      alert('Failed to delete key');
    }
  };

  // Calculate stats from real data
  const activeKeys = keys.filter(k => k.is_active && (!k.expires_at || new Date(k.expires_at) > new Date())).length;
  const lifetimeKeys = keys.filter(k => k.key_type === 'lifetime').length;
  const expiredKeys = keys.filter(k => k.expires_at && new Date(k.expires_at) < new Date()).length;
  const usedKeys = keys.filter(k => k.user_id).length;

  // Determine key status
  const getKeyStatus = (key: LicenseKey): 'active' | 'used' | 'expired' | 'revoked' => {
    if (!key.is_active) return 'revoked';
    if (key.expires_at && new Date(key.expires_at) < new Date()) return 'expired';
    if (key.user_id) return 'used';
    return 'active';
  };

  const filters = [
    { key: 'all', label: 'All Keys', count: keys.length },
    { key: 'active', label: 'Active', count: activeKeys },
    { key: 'used', label: 'Used', count: usedKeys },
    { key: 'expired', label: 'Expired', count: expiredKeys },
  ];

  const filteredKeys = keys.filter(k => {
    const matchesSearch = k.key_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         k.users?.discord_username?.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getKeyStatus(k);
    const matchesFilter = activeFilter === 'all' || status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredKeys.length / limit);
  const paginatedKeys = filteredKeys.slice((page - 1) * limit, page * limit);

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const typeColors: Record<string, string> = {
    lifetime: 'bg-primary/20 text-primary',
    monthly: 'bg-amber-500/20 text-amber-400',
    weekly: 'bg-blue-500/20 text-blue-400',
    daily: 'bg-gray-500/20 text-gray-400',
    custom: 'bg-purple-500/20 text-purple-400',
  };

  const statusColors: Record<string, string> = {
    active: 'text-primary',
    used: 'text-primary',
    expired: 'text-gray-400',
    revoked: 'text-red-400',
  };

  const statusDots: Record<string, string> = {
    active: 'bg-primary',
    used: 'bg-primary',
    expired: 'bg-gray-500',
    revoked: 'bg-red-500',
  };

  return (
    <div className="space-y-5 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">License Keys</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and generate license keys</p>
        </div>
        <button 
          onClick={() => {
            setSelectedKey(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Generate Key
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Key className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : keys.length.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : activeKeys.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Active Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : lifetimeKeys.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Lifetime Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : expiredKeys.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Expired Keys</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md">
        {/* Table Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === filter.key
                      ? 'bg-primary text-black'
                      : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-9 pr-4 py-1.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <button className="p-1.5 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-1.5 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">License Key</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Expires</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Loading keys...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <XCircle className="h-6 w-6 text-red-400 mx-auto" />
                    <p className="text-sm text-red-400 mt-2">{error}</p>
                    <button onClick={fetchKeys} className="mt-2 text-sm text-primary hover:underline">Retry</button>
                  </td>
                </tr>
              ) : paginatedKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Key className="h-6 w-6 text-gray-500 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">No keys found</p>
                  </td>
                </tr>
              ) : paginatedKeys.map((k) => {
                const status = getKeyStatus(k);
                return (
                <tr key={k.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/20">
                        <Key className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <code className="text-xs text-gray-300 font-mono">
                        {k.key_value.substring(0, 8)}...{k.key_value.slice(-4)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(k.key_value)}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        {copiedKey === k.key_value ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColors[k.key_type] || 'bg-gray-500/20 text-gray-400'}`}>
                      {(k.key_type || 'standard').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${statusColors[status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status]}`} />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{k.users?.discord_username || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-1.5 rounded text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Reset HWID"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteKey(k.id, k.key_value)}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        <div className="p-4 border-t border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Rows:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#222] rounded text-xs text-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-gray-500">
              1-{Math.min(limit, filteredKeys.length)} of {filteredKeys.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2.5 py-1 bg-primary text-black text-xs font-semibold rounded">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Form Modal */}
      {showModal && (
        <KeyFormModal
          licenseKey={selectedKey}
          onClose={() => {
            setShowModal(false);
            setSelectedKey(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedKey(null);
            fetchKeys();
          }}
        />
      )}
    </div>
  );
}

// Key Form Modal Component
function KeyFormModal({ licenseKey, onClose, onSuccess }: { licenseKey: LicenseKey | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    key_type: licenseKey?.key_type || 'lifetime',
    duration_days: licenseKey?.expires_at ? Math.ceil((new Date(licenseKey.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
    is_active: licenseKey?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ key_value: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (licenseKey) {
        // Update existing key
        const res = await fetch(`/api/admin/keys/${licenseKey.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_active: formData.is_active,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to update key');
        }

        onSuccess();
      } else {
        // Generate new key
        const res = await fetch('/api/admin/keys/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key_type: formData.key_type,
            duration_days: formData.key_type === 'lifetime' ? null : formData.duration_days,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || 'Failed to generate key');
        }

        setResult(data.key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-lg">
          <div className="p-6 border-b border-[#1a1a1a]">
            <h2 className="text-lg font-bold text-white">Key Generated!</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">License Key:</label>
              <div className="relative">
                <code className="block p-4 bg-[#0a0a0a] rounded-md text-sm text-primary font-mono break-all">
                  {result.key_value}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(result.key_value)}
                  className="absolute top-2 right-2 p-2 bg-[#1a1a1a] rounded text-gray-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Save this key - it won't be shown again!
            </p>
          </div>
          <div className="p-6 border-t border-[#1a1a1a] flex justify-end">
            <button
              onClick={onSuccess}
              className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{licenseKey ? 'Edit Key' : 'Generate Key'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {!licenseKey && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Key Type *</label>
                  <select
                    value={formData.key_type}
                    onChange={(e) => setFormData({ ...formData, key_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="monthly">Monthly (30 days)</option>
                    <option value="weekly">Weekly (7 days)</option>
                    <option value="daily">Daily (1 day)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {formData.key_type === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Duration (days) *</label>
                    <input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      required
                      min="1"
                      placeholder="30"
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                  </div>
                )}
              </>
            )}

            {licenseKey && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary focus:ring-offset-0"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer">
                  Key is active
                </label>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[#1a1a1a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1a1a1a] text-gray-300 text-sm font-medium rounded-md hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {licenseKey ? 'Update Key' : 'Generate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
