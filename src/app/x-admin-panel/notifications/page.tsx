'use client';

import { useState } from 'react';
import { 
  Bell, Check, Trash2, AlertTriangle, Info, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, Search, Filter, MailOpen
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const dummyNotifications: Notification[] = [
  { id: '1', type: 'success', title: 'New Premium User', message: 'john_gamer has upgraded to premium membership.', timestamp: '5 minutes ago', read: false },
  { id: '2', type: 'warning', title: 'High API Usage', message: 'API requests exceeded 80% of rate limit in the last hour.', timestamp: '15 minutes ago', read: false },
  { id: '3', type: 'error', title: 'Failed Login Attempts', message: '5 failed login attempts detected from IP 45.33.32.156.', timestamp: '30 minutes ago', read: false },
  { id: '4', type: 'info', title: 'System Update Available', message: 'A new version (v2.1.0) is available for deployment.', timestamp: '1 hour ago', read: true },
  { id: '5', type: 'success', title: 'Backup Completed', message: 'Daily database backup completed successfully.', timestamp: '2 hours ago', read: true },
  { id: '6', type: 'info', title: 'New Game Script Added', message: 'Blade Ball script has been added to the catalog.', timestamp: '3 hours ago', read: true },
  { id: '7', type: 'warning', title: 'License Key Expiring', message: '15 premium keys will expire within the next 7 days.', timestamp: '5 hours ago', read: true },
  { id: '8', type: 'success', title: 'Report Generated', message: 'Monthly analytics report is ready for download.', timestamp: '1 day ago', read: true },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filters = [
    { key: 'all', label: 'All', count: 8 },
    { key: 'unread', label: 'Unread', count: 3 },
    { key: 'success', label: 'Success', count: 3 },
    { key: 'warning', label: 'Warning', count: 2 },
    { key: 'error', label: 'Error', count: 1 },
  ];

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'unread' ? !n.read : n.type === activeFilter);
    return matchesSearch && matchesFilter;
  });

  const typeIcons: Record<string, typeof Bell> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-500',
    success: 'bg-primary',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your notifications and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-300 text-sm font-medium rounded-md hover:text-white transition-colors"
          >
            <MailOpen className="h-4 w-4" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{notifications.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Info className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{notifications.filter(n => !n.read).length}</p>
            <p className="text-xs text-gray-500">Unread</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{notifications.filter(n => n.type === 'warning').length}</p>
            <p className="text-xs text-gray-500">Warnings</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-red-500">
            <XCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{notifications.filter(n => n.type === 'error').length}</p>
            <p className="text-xs text-gray-500">Errors</p>
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
                  placeholder="Search notifications..."
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

        {/* Notifications List */}
        <div className="divide-y divide-[#1a1a1a]">
          {filteredNotifications.map((notification) => {
            const TypeIcon = typeIcons[notification.type];
            return (
              <div 
                key={notification.id} 
                className={`p-5 hover:bg-[#0a0a0a] transition-colors ${!notification.read ? 'bg-[#0a0a0a]/50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-md ${typeColors[notification.type]}`}>
                    <TypeIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">New</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
              Showing 1-{Math.min(limit, filteredNotifications.length)} of {filteredNotifications.length}
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
