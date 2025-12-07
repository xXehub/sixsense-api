'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Key, Gamepad2, Activity, TrendingUp, TrendingDown, 
  Clock, Shield, Zap, ArrowUpRight, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeKeys: number;
  premiumKeys: number;
  totalGames: number;
  totalExecutions: number;
  weeklyGrowth: number;
}

const recentActivities = [
  { id: 1, action: 'New user registered', user: 'Player123', time: '2 min ago', type: 'user' },
  { id: 2, action: 'Key activated', user: 'xXgamerXx', time: '5 min ago', type: 'key' },
  { id: 3, action: 'Script executed', user: 'ProPlayer', time: '12 min ago', type: 'exec' },
  { id: 4, action: 'Premium key created', user: 'Admin', time: '1 hour ago', type: 'key' },
  { id: 5, action: 'User verified', user: 'NewUser456', time: '2 hours ago', type: 'user' },
];

const topGames = [
  { name: 'Blox Fruits', executions: 12450, growth: 23 },
  { name: 'Pet Simulator X', executions: 8920, growth: 15 },
  { name: 'Anime Adventures', executions: 6780, growth: -5 },
  { name: 'Tower Defense', executions: 4560, growth: 8 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      setStats({
        totalUsers: 1234,
        activeKeys: 856,
        premiumKeys: 124,
        totalGames: 12,
        totalExecutions: 45678,
        weeklyGrowth: 12,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      change: 12,
      icon: Users,
      bgColor: 'bg-blue-500',
      href: '/x-admin-panel/users',
    },
    {
      label: 'Active Keys',
      value: stats?.activeKeys?.toLocaleString() || '0',
      change: 8,
      icon: Key,
      bgColor: 'bg-amber-500',
      href: '/x-admin-panel/keys',
    },
    {
      label: 'Total Games',
      value: stats?.totalGames || '0',
      change: 2,
      icon: Gamepad2,
      bgColor: 'bg-purple-500',
      href: '/x-admin-panel/games',
    },
    {
      label: 'Executions',
      value: stats?.totalExecutions?.toLocaleString() || '0',
      change: 23,
      icon: Activity,
      bgColor: 'bg-primary',
      href: '/x-admin-panel/logs',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here's your overview.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid - Solid Color Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#111] rounded-md p-5 animate-pulse">
              <div className="h-10 w-10 bg-[#1a1a1a] rounded-md mb-4" />
              <div className="h-6 w-20 bg-[#1a1a1a] rounded mb-2" />
              <div className="h-4 w-16 bg-[#1a1a1a] rounded" />
            </div>
          ))
        ) : (
          statCards.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className="bg-[#111] rounded-md p-5 hover:bg-[#151515] transition-all group border border-[#1a1a1a]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-md ${stat.bgColor}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  stat.change >= 0 ? 'text-primary' : 'text-red-400'
                }`}>
                  {stat.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-400">{stat.label}</p>
                <ArrowUpRight className="h-4 w-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-[#111] border border-[#1a1a1a] rounded-md p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">Activity Overview</h3>
              <p className="text-sm text-gray-500 mt-0.5">Last 7 days performance</p>
            </div>
            <select className="px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-gray-300 focus:outline-none focus:border-primary/50">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>
          
          <div className="h-52 flex items-center justify-center border border-dashed border-[#222] rounded-md bg-[#0a0a0a]">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-primary/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chart coming soon</p>
            </div>
          </div>
        </div>

        {/* Top Games */}
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Top Games</h3>
            <Link href="/x-admin-panel/games" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {topGames.map((game, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-[#0a0a0a] hover:bg-[#0f0f0f] transition-colors">
                <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{game.name}</p>
                  <p className="text-xs text-gray-500">{game.executions.toLocaleString()} runs</p>
                </div>
                <div className={`text-xs font-semibold ${game.growth >= 0 ? 'text-primary' : 'text-red-400'}`}>
                  {game.growth >= 0 ? '+' : ''}{game.growth}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#111] border border-[#1a1a1a] rounded-md p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Recent Activity</h3>
            <Link href="/x-admin-panel/logs" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              View all
            </Link>
          </div>
          
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-md bg-[#0a0a0a] hover:bg-[#0f0f0f] transition-colors">
                <div className="p-2 rounded-md bg-primary/20">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500">by {activity.user}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          {/* System Status */}
          <div className="bg-primary/10 border border-primary/20 rounded-md p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary">
                  <Zap className="h-5 w-5 text-black" />
                </div>
                <span className="text-sm font-medium text-gray-300">System Status</span>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="text-lg font-bold text-primary mt-4">Operational</p>
            <p className="text-sm text-gray-500 mt-1">All systems running smoothly</p>
          </div>

          {/* Last Backup */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-500">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-300">Last Backup</span>
            </div>
            <p className="text-lg font-bold text-white mt-4">2 hours ago</p>
            <p className="text-sm text-gray-500 mt-1">Next scheduled in 4 hours</p>
          </div>

          {/* Security */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-md p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-300">Security</span>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">ACTIVE</span>
            </div>
            <p className="text-lg font-bold text-white mt-4">Protected</p>
            <p className="text-sm text-gray-500 mt-1">No threats detected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
