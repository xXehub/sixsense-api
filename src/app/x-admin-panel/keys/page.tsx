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
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
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
                      <button className="p-1.5 rounded text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
    </div>
  );
}
