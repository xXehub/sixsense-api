'use client';

import { useState } from 'react';
import { 
  Users, UserPlus, Search, Filter, Download,
  Edit, Trash2, Ban, CheckCircle, XCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

interface User {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar?: string;
  email?: string;
  role: 'user' | 'premium' | 'admin';
  is_banned: boolean;
  created_at: string;
}

const dummyUsers: User[] = [
  { id: '1', discord_id: '123456789', discord_username: 'Player123', email: 'player@email.com', role: 'user', is_banned: false, created_at: '2024-01-15' },
  { id: '2', discord_id: '987654321', discord_username: 'xXgamerXx', email: 'gamer@email.com', role: 'premium', is_banned: false, created_at: '2024-01-20' },
  { id: '3', discord_id: '456789123', discord_username: 'ProPlayer', email: 'pro@email.com', role: 'premium', is_banned: false, created_at: '2024-02-01' },
  { id: '4', discord_id: '789123456', discord_username: 'BannedUser', email: 'banned@email.com', role: 'user', is_banned: true, created_at: '2024-02-10' },
  { id: '5', discord_id: '321654987', discord_username: 'NewUser456', email: 'new@email.com', role: 'user', is_banned: false, created_at: '2024-03-01' },
  { id: '6', discord_id: '111222333', discord_username: 'AdminUser', email: 'admin@email.com', role: 'admin', is_banned: false, created_at: '2024-01-01' },
];

export default function UsersPage() {
  const [users] = useState<User[]>(dummyUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters = [
    { key: 'all', label: 'All Users', count: 6 },
    { key: 'premium', label: 'Premium', count: 2 },
    { key: 'banned', label: 'Banned', count: 1 },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.discord_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'premium' && user.role === 'premium') ||
                         (activeFilter === 'banned' && user.is_banned);
    return matchesSearch && matchesFilter;
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-400',
    premium: 'bg-amber-500/20 text-amber-400',
    user: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400 mt-1">Manage all registered users</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
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
            <p className="text-lg font-bold text-white">1,234</p>
            <p className="text-xs text-gray-500">Total Users</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">124</p>
            <p className="text-xs text-gray-500">Premium Users</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">23</p>
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
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {user.discord_username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.discord_username}</p>
                        <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-gray-300 bg-[#1a1a1a] px-2 py-1 rounded font-mono">
                      {user.discord_id}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${roleColors[user.role]}`}>
                      {user.role.toUpperCase()}
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
                      <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Ban className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing 1-{Math.min(limit, filteredUsers.length)} of {filteredUsers.length}
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
    </div>
  );
}
