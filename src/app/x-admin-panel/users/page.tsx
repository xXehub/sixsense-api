'use client';

import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Filter, Download,
  Edit, Trash2, Ban, CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw, Loader2
} from 'lucide-react';

interface User {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar?: string;
  keys_count?: number;
  is_banned: boolean;
  ban_reason?: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete user');
      }
      
      await fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Failed to delete user');
    }
  };

  // Calculate stats from real data
  const totalUsers = users.length;
  const premiumUsers = users.filter(u => (u.keys_count || 0) > 0).length;
  const bannedUsers = users.filter(u => u.is_banned).length;

  const filters = [
    { key: 'all', label: 'All Users', count: totalUsers },
    { key: 'premium', label: 'With Keys', count: premiumUsers },
    { key: 'banned', label: 'Banned', count: bannedUsers },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.discord_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.discord_id?.includes(searchQuery);
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'premium' && (user.keys_count || 0) > 0) ||
                         (activeFilter === 'banned' && user.is_banned);
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / limit);
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all registered users</p>
        </div>
        <button 
          onClick={() => {
            setSelectedUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : totalUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : premiumUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">With Keys</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{isLoading ? '...' : bannedUsers.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Banned Users</p>
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

            {/* Search & Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <button className="p-2 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-2 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
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
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Discord ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Keys</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <XCircle className="h-6 w-6 text-red-400 mx-auto" />
                    <p className="text-sm text-red-400 mt-2">{error}</p>
                    <button onClick={fetchUsers} className="mt-2 text-sm text-primary hover:underline">Retry</button>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="h-6 w-6 text-gray-500 mx-auto" />
                    <p className="text-sm text-gray-400 mt-2">No users found</p>
                  </td>
                </tr>
              ) : paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {user.discord_username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.discord_username || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{user.keys_count || 0} keys</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-gray-300 bg-[#1a1a1a] px-2 py-1 rounded font-mono">
                      {user.discord_id}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${(user.keys_count || 0) > 0 ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'}`}>
                      {user.keys_count || 0} KEYS
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.is_banned ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Banned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-2 rounded-md text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title="Ban user"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.discord_username)}
                        className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer - Pagination */}
        <div className="p-5 border-t border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {filteredUsers.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, filteredUsers.length)} of {filteredUsers.length}
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
              className="p-2 rounded-md bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <UserFormModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

// User Form Modal Component
function UserFormModal({ user, onClose, onSuccess }: { user: User | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    discord_id: user?.discord_id || '',
    discord_username: user?.discord_username || '',
    is_banned: user?.is_banned ?? false,
    ban_reason: user?.ban_reason || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_id: formData.discord_id,
          discord_username: formData.discord_username,
          is_banned: formData.is_banned,
          ban_reason: formData.ban_reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save user');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Discord ID *</label>
              <input
                type="text"
                value={formData.discord_id}
                onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
                required
                placeholder="123456789012345678"
                disabled={!!user}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Discord Username *</label>
              <input
                type="text"
                value={formData.discord_username}
                onChange={(e) => setFormData({ ...formData, discord_username: e.target.value })}
                required
                placeholder="username"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_banned"
                checked={formData.is_banned}
                onChange={(e) => setFormData({ ...formData, is_banned: e.target.checked })}
                className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-primary focus:ring-primary focus:ring-offset-0"
              />
              <label htmlFor="is_banned" className="text-sm text-gray-300 cursor-pointer">
                Ban this user
              </label>
            </div>

            {formData.is_banned && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Ban Reason</label>
                <textarea
                  value={formData.ban_reason}
                  onChange={(e) => setFormData({ ...formData, ban_reason: e.target.value })}
                  rows={3}
                  placeholder="Reason for ban..."
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-white text-sm focus:outline-none focus:border-primary/50 resize-none"
                />
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
              {user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
