'use client';

import { useState } from 'react';
import { 
  Gamepad2, Plus, Search, Filter, ExternalLink, Edit, Trash2,
  ChevronLeft, ChevronRight, Play, Pause, Wrench, TrendingUp
} from 'lucide-react';

interface Game {
  id: string;
  name: string;
  game_id: string;
  status: 'active' | 'maintenance' | 'disabled';
  executions: number;
  users: number;
  last_updated: string;
}

const dummyGames: Game[] = [
  { id: '1', name: 'Blox Fruits', game_id: '2753915549', status: 'active', executions: 12450, users: 2340, last_updated: '2024-03-01' },
  { id: '2', name: 'Pet Simulator X', game_id: '6284583030', status: 'active', executions: 8920, users: 1890, last_updated: '2024-02-28' },
  { id: '3', name: 'Anime Adventures', game_id: '8304191830', status: 'maintenance', executions: 6780, users: 1250, last_updated: '2024-02-25' },
  { id: '4', name: 'Tower Defense Simulator', game_id: '3260590327', status: 'active', executions: 4560, users: 980, last_updated: '2024-02-20' },
  { id: '5', name: 'Murder Mystery 2', game_id: '142823291', status: 'disabled', executions: 3200, users: 560, last_updated: '2024-01-15' },
  { id: '6', name: 'Adopt Me', game_id: '920587237', status: 'active', executions: 2890, users: 720, last_updated: '2024-03-02' },
];

export default function GamesPage() {
  const [games] = useState<Game[]>(dummyGames);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters = [
    { key: 'all', label: 'All Games', count: 6 },
    { key: 'active', label: 'Active', count: 4 },
    { key: 'maintenance', label: 'Maintenance', count: 1 },
    { key: 'disabled', label: 'Disabled', count: 1 },
  ];

  const filteredGames = games.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         g.game_id.includes(searchQuery);
    const matchesFilter = activeFilter === 'all' || g.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const statusColors: Record<string, string> = {
    active: 'text-primary',
    maintenance: 'text-amber-400',
    disabled: 'text-red-400',
  };

  const statusDots: Record<string, string> = {
    active: 'bg-primary',
    maintenance: 'bg-amber-500',
    disabled: 'bg-red-500',
  };

  const statusIcons: Record<string, typeof Play> = {
    active: Play,
    maintenance: Wrench,
    disabled: Pause,
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Games</h1>
          <p className="text-sm text-gray-400 mt-1">Manage supported games and scripts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Game
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">24</p>
            <p className="text-xs text-gray-500">Total Games</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Play className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">18</p>
            <p className="text-xs text-gray-500">Active Games</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">4</p>
            <p className="text-xs text-gray-500">In Maintenance</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">38.8K</p>
            <p className="text-xs text-gray-500">Total Executions</p>
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
                  placeholder="Search games..."
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
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Game</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Game ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Executions</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredGames.map((game) => {
                const StatusIcon = statusIcons[game.status];
                return (
                  <tr key={game.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-blue-500/20">
                          <Gamepad2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{game.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-400 font-mono">{game.game_id}</code>
                        <a
                          href={`https://www.roblox.com/games/${game.game_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-gray-500 hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusColors[game.status]}`}>
                        <span className={`w-2 h-2 rounded-full ${statusDots[game.status]}`} />
                        {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white font-medium">
                        {game.executions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-400">
                        {game.users.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-400">
                        {new Date(game.last_updated).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              Showing 1-{Math.min(limit, filteredGames.length)} of {filteredGames.length}
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
