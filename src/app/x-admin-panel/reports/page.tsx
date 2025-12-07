'use client';

import { useState } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, BarChart3, 
  RefreshCw, ChevronLeft, ChevronRight, Search, Filter, Clock
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'analytics' | 'financial' | 'users' | 'system';
  description: string;
  lastGenerated: string;
  size: string;
  status: 'ready' | 'generating' | 'scheduled';
}

const dummyReports: Report[] = [
  { id: '1', name: 'Monthly Analytics Report', type: 'analytics', description: 'User activity, page views, and engagement metrics', lastGenerated: '2024-03-15', size: '2.4 MB', status: 'ready' },
  { id: '2', name: 'User Growth Report', type: 'users', description: 'New registrations, retention rates, and demographics', lastGenerated: '2024-03-14', size: '1.8 MB', status: 'ready' },
  { id: '3', name: 'Revenue Report', type: 'financial', description: 'Premium subscriptions, key sales, and revenue breakdown', lastGenerated: '2024-03-13', size: '856 KB', status: 'ready' },
  { id: '4', name: 'System Health Report', type: 'system', description: 'Server uptime, API response times, and error rates', lastGenerated: '2024-03-15', size: '1.2 MB', status: 'generating' },
  { id: '5', name: 'License Key Usage', type: 'analytics', description: 'Key activations, expirations, and usage patterns', lastGenerated: '2024-03-12', size: '945 KB', status: 'ready' },
  { id: '6', name: 'Security Audit Report', type: 'system', description: 'Login attempts, suspicious activities, and security events', lastGenerated: '2024-03-10', size: '1.5 MB', status: 'scheduled' },
];

export default function ReportsPage() {
  const [reports] = useState<Report[]>(dummyReports);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters = [
    { key: 'all', label: 'All Reports', count: 6 },
    { key: 'analytics', label: 'Analytics', count: 2 },
    { key: 'users', label: 'Users', count: 1 },
    { key: 'financial', label: 'Financial', count: 1 },
    { key: 'system', label: 'System', count: 2 },
  ];

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || r.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const typeBadges: Record<string, string> = {
    analytics: 'bg-blue-500/20 text-blue-400',
    financial: 'bg-amber-500/20 text-amber-400',
    users: 'bg-purple-500/20 text-purple-400',
    system: 'bg-gray-500/20 text-gray-400',
  };

  const statusColors: Record<string, string> = {
    ready: 'text-primary',
    generating: 'text-amber-400',
    scheduled: 'text-blue-400',
  };

  const statusDots: Record<string, string> = {
    ready: 'bg-primary',
    generating: 'bg-amber-500',
    scheduled: 'bg-blue-500',
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Generate and download analytics reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">24</p>
            <p className="text-xs text-gray-500">Total Reports</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Download className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">156</p>
            <p className="text-xs text-gray-500">Downloads</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">5</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">45 MB</p>
            <p className="text-xs text-gray-500">Storage Used</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md">
        {/* Table Header */}
        <div className="p-5 border-b border-[#1a1a1a]">
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
                  <span className={`ml-1.5 ${activeFilter === filter.key ? 'text-black/70' : 'text-gray-500'}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
              </div>
              <button className="p-2 bg-[#1a1a1a] rounded-md text-gray-400 hover:text-white transition-colors">
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
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Report</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Generated</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Size</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-blue-500/20">
                        <FileText className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{report.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${typeBadges[report.type]}`}>
                      {report.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusColors[report.status]}`}>
                      <span className={`w-2 h-2 rounded-full ${statusDots[report.status]}`} />
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-400">
                      {new Date(report.lastGenerated).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-400">{report.size}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
                        disabled={report.status !== 'ready'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-md text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                        <Clock className="h-4 w-4" />
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
              Showing 1-{Math.min(limit, filteredReports.length)} of {filteredReports.length}
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
