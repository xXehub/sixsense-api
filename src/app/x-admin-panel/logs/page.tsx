'use client';

import { useState } from 'react';
import { 
  Activity, Search, Filter, Download, RefreshCw, 
  ChevronLeft, ChevronRight, Shield, AlertTriangle, User, Settings
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'admin' | 'system' | 'security' | 'user';
  action: string;
  user: string;
  ip: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

const dummyLogs: LogEntry[] = [
  { id: '1', timestamp: '2024-03-15 14:32:15', type: 'auth', action: 'User Login', user: 'skeet_admin', ip: '192.168.1.1', details: 'Discord OAuth successful login', status: 'success' },
  { id: '2', timestamp: '2024-03-15 14:30:22', type: 'admin', action: 'Key Generated', user: 'skeet_admin', ip: '192.168.1.1', details: 'Generated premium key: SIX-XXXX-XXXX', status: 'success' },
  { id: '3', timestamp: '2024-03-15 14:28:10', type: 'security', action: 'Failed Login Attempt', user: 'unknown', ip: '45.33.32.156', details: 'Invalid credentials - 3rd attempt', status: 'error' },
  { id: '4', timestamp: '2024-03-15 14:25:45', type: 'user', action: 'Profile Updated', user: 'john_gamer', ip: '192.168.1.50', details: 'Changed display name', status: 'success' },
  { id: '5', timestamp: '2024-03-15 14:22:33', type: 'system', action: 'Server Restart', user: 'system', ip: 'localhost', details: 'Scheduled maintenance restart', status: 'warning' },
  { id: '6', timestamp: '2024-03-15 14:20:00', type: 'admin', action: 'User Banned', user: 'skeet_admin', ip: '192.168.1.1', details: 'Banned user: banned_user for ToS violation', status: 'success' },
  { id: '7', timestamp: '2024-03-15 14:15:22', type: 'security', action: 'Rate Limit Exceeded', user: 'api_consumer', ip: '203.0.113.42', details: 'API rate limit exceeded', status: 'error' },
  { id: '8', timestamp: '2024-03-15 14:10:11', type: 'admin', action: 'Game Added', user: 'skeet_admin', ip: '192.168.1.1', details: 'Added new game: Blade Ball', status: 'success' },
];

export default function LogsPage() {
  const [logs] = useState<LogEntry[]>(dummyLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'auth', label: 'Auth' },
    { key: 'admin', label: 'Admin' },
    { key: 'security', label: 'Security' },
    { key: 'system', label: 'System' },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || log.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const typeIcons: Record<string, typeof Activity> = {
    auth: User,
    admin: Shield,
    system: Settings,
    security: AlertTriangle,
    user: User,
  };

  const typeBadges: Record<string, string> = {
    auth: 'bg-blue-500/20 text-blue-400',
    admin: 'bg-primary/20 text-primary',
    system: 'bg-gray-500/20 text-gray-400',
    security: 'bg-red-500/20 text-red-400',
    user: 'bg-purple-500/20 text-purple-400',
  };

  const statusColors: Record<string, string> = {
    success: 'text-primary',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };

  const statusDots: Record<string, string> = {
    success: 'bg-primary',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div className="space-y-5 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Activity Logs</h1>
          <p className="text-sm text-gray-400 mt-1">Monitor system and user activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] text-gray-300 text-sm font-medium rounded-md hover:text-white transition-colors">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">12,458</p>
            <p className="text-xs text-gray-500">Total Logs</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Shield className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">1,234</p>
            <p className="text-xs text-gray-500">Admin Actions</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">89</p>
            <p className="text-xs text-gray-500">Warnings</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">23</p>
            <p className="text-xs text-gray-500">Errors</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md">
        {/* Table Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
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
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-9 pr-4 py-1.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <button className="p-1.5 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredLogs.map((log) => {
                const TypeIcon = typeIcons[log.type] || Activity;
                return (
                  <tr key={log.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 font-mono">{log.timestamp}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${typeBadges[log.type]}`}>
                        <TypeIcon className="h-3 w-3" />
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-white">{log.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{log.details}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-300">{log.user}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs text-gray-400 font-mono">{log.ip}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${statusColors[log.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDots[log.status]}`} />
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
              <option value={100}>100</option>
            </select>
            <span className="text-xs text-gray-500">
              1-{Math.min(limit, filteredLogs.length)} of {filteredLogs.length}
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
