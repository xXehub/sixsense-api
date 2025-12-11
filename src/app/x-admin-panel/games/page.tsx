'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Gamepad2, Plus, Search, Filter, ExternalLink, Edit, Trash2,
  ChevronLeft, ChevronRight, Play, Pause, Loader2
} from 'lucide-react';

interface Game {
  id: number;
  place_id: string;
  game_name: string;
  script_url: string;
  description: string | null;
  is_active: boolean;
  min_key_tier: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface GamesResponse {
  success: boolean;
  data?: {
    games: Game[];
    total: number;
  };
  error?: string;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/games');
      
      if (!res.ok) {
        if (res.status === 403) {
          setError('Access denied. Please login as admin.');
        } else {
          setError(`Server error: ${res.status}`);
        }
        return;
      }
      
      const data: GamesResponse = await res.json();
      
      if (data.success && data.data) {
        setGames(data.data.games);
      } else {
        setError(data.error || 'Failed to fetch games');
      }
    } catch (err) {
      setError('Failed to fetch games. Check console for details.');
      console.error('Fetch games error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dynamic stats based on fetched games
  const stats = {
    total: games.length,
    active: games.filter(g => g.is_active).length,
    inactive: games.filter(g => !g.is_active).length,
  };

  const filters = [
    { key: 'all', label: 'All Games', count: stats.total },
    { key: 'active', label: 'Active', count: stats.active },
    { key: 'inactive', label: 'Inactive', count: stats.inactive },
  ];

  const filteredGames = games.filter(g => {
    const matchesSearch = g.game_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         g.place_id.includes(searchQuery);
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'active' && g.is_active) || 
      (activeFilter === 'inactive' && !g.is_active);
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / limit);
  const paginatedGames = filteredGames.slice((page - 1) * limit, page * limit);

  // Simple active/inactive status based on is_active field
  const getGameStatus = (game: Game): 'active' | 'inactive' => {
    return game.is_active ? 'active' : 'inactive';
  };

  const statusColors: Record<string, string> = {
    active: 'text-primary',
    inactive: 'text-red-400',
  };

  const statusDots: Record<string, string> = {
    active: 'bg-primary',
    inactive: 'bg-red-500',
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <Gamepad2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.total}</p>
            <p className="text-xs text-gray-500">Total Games</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Play className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.active}</p>
            <p className="text-xs text-gray-500">Active Games</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <Pause className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{loading ? '...' : stats.inactive}</p>
            <p className="text-xs text-gray-500">Inactive Games</p>
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
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Place ID</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Min Tier</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading games...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="text-red-400">{error}</div>
                    <button 
                      onClick={fetchGames}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : paginatedGames.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                    No games found
                  </td>
                </tr>
              ) : (
                paginatedGames.map((game) => {
                  const status = getGameStatus(game);
                  return (
                    <tr key={game.id} className="hover:bg-[#0a0a0a] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-primary/20">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-white">{game.game_name}</span>
                            {game.description && (
                              <p className="text-xs text-gray-500 max-w-xs truncate">{game.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-gray-400 font-mono">{game.place_id}</code>
                          <a
                            href={`https://www.roblox.com/games/${game.place_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-gray-500 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${statusColors[status]}`}>
                          <span className={`w-2 h-2 rounded-full ${statusDots[status]}`} />
                          {status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-white font-medium">
                          Tier {game.min_key_tier}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-400">
                          {new Date(game.created_at).toLocaleDateString()}
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
                })
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
              disabled={page >= totalPages}
              className="p-2 rounded-md bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
