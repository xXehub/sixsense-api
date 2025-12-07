'use client';

import { useState } from 'react';
import { 
  Key, Plus, Search, Filter, Download, Copy, Check,
  Trash2, RefreshCw, ChevronLeft, ChevronRight, Sparkles, Clock, XCircle
} from 'lucide-react';

interface LicenseKey {
  id: string;
  key: string;
  type: 'standard' | 'premium' | 'trial';
  status: 'active' | 'used' | 'expired' | 'revoked';
  user?: string;
  created_at: string;
  expires_at?: string;
}

const dummyKeys: LicenseKey[] = [
  { id: '1', key: 'SIX-XXXX-YYYY-ZZZZ-1234', type: 'premium', status: 'active', created_at: '2024-03-01', expires_at: '2025-03-01' },
  { id: '2', key: 'SIX-AAAA-BBBB-CCCC-5678', type: 'standard', status: 'used', user: 'Player123', created_at: '2024-02-15' },
  { id: '3', key: 'SIX-DDDD-EEEE-FFFF-9012', type: 'premium', status: 'used', user: 'xXgamerXx', created_at: '2024-02-20', expires_at: '2025-02-20' },
  { id: '4', key: 'SIX-GGGG-HHHH-IIII-3456', type: 'standard', status: 'expired', user: 'OldUser', created_at: '2023-01-01' },
  { id: '5', key: 'SIX-JJJJ-KKKK-LLLL-7890', type: 'trial', status: 'revoked', created_at: '2024-01-10' },
  { id: '6', key: 'SIX-MMMM-NNNN-OOOO-1111', type: 'premium', status: 'active', created_at: '2024-03-05', expires_at: '2025-03-05' },
];

export default function KeysPage() {
  const [keys] = useState<LicenseKey[]>(dummyKeys);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filters = [
    { key: 'all', label: 'All Keys', count: 6 },
    { key: 'active', label: 'Active', count: 2 },
    { key: 'used', label: 'Used', count: 2 },
    { key: 'expired', label: 'Expired', count: 2 },
  ];

  const filteredKeys = keys.filter(k => {
    const matchesSearch = k.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         k.user?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || k.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const typeColors: Record<string, string> = {
    premium: 'bg-amber-500/20 text-amber-400',
    standard: 'bg-blue-500/20 text-blue-400',
    trial: 'bg-purple-500/20 text-purple-400',
  };

  const statusColors: Record<string, string> = {
    active: 'text-primary',
    used: 'text-blue-400',
    expired: 'text-gray-400',
    revoked: 'text-red-400',
  };

  const statusDots: Record<string, string> = {
    active: 'bg-primary',
    used: 'bg-blue-500',
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
            <p className="text-lg font-bold text-white">856</p>
            <p className="text-xs text-gray-500">Total Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">124</p>
            <p className="text-xs text-gray-500">Active Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">89</p>
            <p className="text-xs text-gray-500">Premium Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">45</p>
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
              {filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/20">
                        <Key className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <code className="text-xs text-gray-300 font-mono">
                        {k.key.substring(0, 8)}...{k.key.slice(-4)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(k.key)}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                      >
                        {copiedKey === k.key ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${typeColors[k.type]}`}>
                      {k.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${statusColors[k.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDots[k.status]}`} />
                      {k.status.charAt(0).toUpperCase() + k.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{k.user || '—'}</span>
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
              ))}
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
