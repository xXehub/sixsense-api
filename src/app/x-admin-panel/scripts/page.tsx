'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Code, Plus, Search, Filter, Copy, Edit, Trash2,
  ChevronLeft, ChevronRight, Shield, Eye, EyeOff, 
  Loader2, Check, ExternalLink, Lock, Unlock, RefreshCw
} from 'lucide-react';

interface ProtectedScript {
  id: string;
  name: string;
  description: string | null;
  version: string;
  access_key: string;
  require_key: boolean;
  require_hwid: boolean;
  allowed_games: string[] | null;
  is_active: boolean;
  total_loads: number;
  created_at: string;
  updated_at: string;
  loadstring_url: string;
  loadstring_code: string;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ProtectedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScript, setSelectedScript] = useState<ProtectedScript | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchScripts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/scripts');
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Please login as admin.');
        } else {
          setError(`Server error: ${res.status}`);
        }
        return;
      }
      
      const data: any = await res.json();
      console.log('Scripts API response:', data);
      
      if (data.success) {
        // API returns { success: true, scripts: [], total: 0 }
        setScripts(data.scripts || []);
      } else {
        setError(data.error || 'Failed to fetch scripts');
      }
    } catch (err) {
      setError('Failed to fetch scripts');
      console.error('Fetch scripts error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  // Stats
  const stats = {
    total: scripts.length,
    active: scripts.filter(s => s.is_active).length,
    protected: scripts.filter(s => s.require_key).length,
    totalLoads: scripts.reduce((acc, s) => acc + (s.total_loads || 0), 0),
  };

  const filters = [
    { key: 'all', label: 'All Scripts', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'protected', label: 'Key Required', count: stats.protected },
  ];

  const filteredScripts = scripts.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.access_key.includes(searchQuery);
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'active' && s.is_active) || 
      (activeFilter === 'protected' && s.require_key);
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredScripts.length / limit);
  const paginatedScripts = filteredScripts.slice((page - 1) * limit, page * limit);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Protected Scripts</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and protect your Lua scripts (Luarmor-style)</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchScripts}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-300 text-sm font-medium rounded-md hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Script
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Code className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.total}</p>
            <p className="text-xs text-gray-500">Total Scripts</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Eye className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.active}</p>
            <p className="text-xs text-gray-500">Active Scripts</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.protected}</p>
            <p className="text-xs text-gray-500">Key Protected</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <ExternalLink className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.totalLoads.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Loads</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md">
        {/* Table Header */}
        <div className="p-5 border-b border-[#1a1a1a]">
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
                  <span className={`ml-1.5 ${activeFilter === filter.key ? 'text-black/70' : 'text-gray-500'}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Script</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Loadstring</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Protection</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Loads</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading scripts...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="text-red-400">{error}</div>
                    <button 
                      onClick={fetchScripts}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedScripts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No scripts found. Add your first protected script!
                  </td>
                </tr>
              ) : (
                paginatedScripts.map((script) => (
                  <tr key={script.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-blue-500/20">
                          <Code className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-white">{script.name}</span>
                          <p className="text-xs text-gray-500">v{script.version}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-400 font-mono bg-[#0a0a0a] px-2 py-1 rounded max-w-[200px] truncate">
                          {script.loadstring_code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(script.loadstring_code, script.id)}
                          className="p-1.5 rounded text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                          title="Copy loadstring"
                        >
                          {copiedId === script.id ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {script.require_key ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                            <Lock className="h-3 w-3" /> Key Required
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-500/10 px-2 py-1 rounded">
                            <Unlock className="h-3 w-3" /> Open
                          </span>
                        )}
                        {script.require_hwid && (
                          <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                            HWID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white font-medium">
                        {(script.total_loads || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                        script.is_active ? 'text-primary' : 'text-red-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          script.is_active ? 'bg-primary' : 'bg-red-500'
                        }`} />
                        {script.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setSelectedScript(script);
                            setShowEditModal(true);
                          }}
                          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        <div className="p-5 border-t border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, filteredScripts.length)} of {filteredScripts.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-md bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 bg-primary text-black text-sm font-semibold rounded-md">{page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-md bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Script Modal */}
      {showCreateModal && (
        <CreateScriptModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchScripts();
          }}
        />
      )}

      {/* Edit Script Modal */}
      {showEditModal && selectedScript && (
        <EditScriptModal 
          script={selectedScript}
          onClose={() => {
            setShowEditModal(false);
            setSelectedScript(null);
          }} 
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedScript(null);
            fetchScripts();
          }}
        />
      )}
    </div>
  );
}

// Create Script Modal Component
function CreateScriptModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [scriptContent, setScriptContent] = useState('');
  const [requireKey, setRequireKey] = useState(true);
  const [requireHwid, setRequireHwid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ loadstring_code: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          version,
          script_content: scriptContent,
          require_key: requireKey,
          require_hwid: requireHwid,
        }),
      });

      const data = await res.json();
      console.log('Create script response:', data);

      if (data.success) {
        setResult(data.script);
      } else {
        setError(data.error || data.message || 'Failed to create script');
      }
    } catch (err) {
      setError('Failed to create script');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-lg">
          <div className="p-6 border-b border-[#1a1a1a]">
            <h2 className="text-lg font-bold text-white">Script Created!</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Loadstring Code:</label>
              <div className="relative">
                <code className="block p-4 bg-[#0a0a0a] rounded-md text-sm text-primary font-mono break-all">
                  {result.loadstring_code}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(result.loadstring_code)}
                  className="absolute top-2 right-2 p-2 bg-[#1a1a1a] rounded text-gray-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Use this code in your Roblox executor to load the script. The script is protected and cannot be viewed in browsers.
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
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Protected Script</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Script Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="My Script"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the script"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Lua Script Content *</label>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                required
                rows={12}
                placeholder="-- Paste your Lua script here..."
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm font-mono focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireKey}
                  onChange={(e) => setRequireKey(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Require License Key</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHwid}
                  onChange={(e) => setRequireHwid(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Require HWID Binding</span>
              </label>
            </div>
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
              Create Script
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Script Modal Component
function EditScriptModal({ script, onClose, onSuccess }: { script: ProtectedScript; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(script.name);
  const [description, setDescription] = useState(script.description || '');
  const [version, setVersion] = useState(script.version);
  const [requireKey, setRequireKey] = useState(script.require_key);
  const [requireHwid, setRequireHwid] = useState(script.require_hwid);
  const [isActive, setIsActive] = useState(script.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [scriptContent, setScriptContent] = useState('');

  // Fetch full script content when needed
  const fetchContent = async () => {
    const res = await fetch(`/api/admin/scripts/${script.id}`);
    const data = await res.json();
    console.log('Fetch script content response:', data);
    if (data.success) {
      setScriptContent(data.script?.script_content || '');
      setShowContent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        name,
        description,
        version,
        require_key: requireKey,
        require_hwid: requireHwid,
        is_active: isActive,
      };
      
      if (showContent && scriptContent) {
        body.script_content = scriptContent;
      }

      const res = await fetch(`/api/admin/scripts/${script.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update script');
      }
    } catch (err) {
      setError('Failed to update script');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Edit Script</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Loadstring Info */}
            <div className="p-4 bg-[#0a0a0a] rounded-md">
              <label className="block text-sm font-medium text-gray-400 mb-2">Loadstring Code:</label>
              <code className="text-xs text-primary font-mono">{script.loadstring_code}</code>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Script Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Script Content Toggle */}
            <div>
              {!showContent ? (
                <button
                  type="button"
                  onClick={fetchContent}
                  className="text-sm text-primary hover:underline"
                >
                  Click to edit script content
                </button>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Script Content</label>
                  <textarea
                    value={scriptContent}
                    onChange={(e) => setScriptContent(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm font-mono focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireKey}
                  onChange={(e) => setRequireKey(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-300">Require Key</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHwid}
                  onChange={(e) => setRequireHwid(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-300">Require HWID</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
