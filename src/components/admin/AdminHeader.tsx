'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, Plus, ChevronRight } from 'lucide-react';

const pageTitles: Record<string, { title: string; breadcrumb?: string[] }> = {
  '/x-admin-panel': { title: 'Dashboard' },
  '/x-admin-panel/users': { title: 'All Users', breadcrumb: ['User Management', 'All Users'] },
  '/x-admin-panel/users/add': { title: 'Add User', breadcrumb: ['User Management', 'Add User'] },
  '/x-admin-panel/keys': { title: 'All Keys', breadcrumb: ['License Keys', 'All Keys'] },
  '/x-admin-panel/keys/generate': { title: 'Generate Key', breadcrumb: ['License Keys', 'Generate'] },
  '/x-admin-panel/games': { title: 'Games' },
  '/x-admin-panel/settings': { title: 'General Settings', breadcrumb: ['Settings', 'General'] },
  '/x-admin-panel/logs': { title: 'Activity Logs', breadcrumb: ['Analytics', 'Activity Logs'] },
  '/x-admin-panel/notifications': { title: 'Notifications' },
  '/x-admin-panel/reports': { title: 'Reports', breadcrumb: ['Analytics', 'Reports'] },
  '/x-admin-panel/help': { title: 'Help & Docs' },
};

export default function AdminHeader() {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: 'Admin' };

  return (
    <header className="h-16 border-b border-[#1a1a1a] bg-[#0a0a0a] px-6 flex items-center justify-between">
      {/* Left - Breadcrumb */}
      <div className="flex items-center gap-2">
        {pageInfo.breadcrumb ? (
          <div className="flex items-center gap-1.5 text-sm">
            {pageInfo.breadcrumb.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-600" />}
                <span className={idx === pageInfo.breadcrumb!.length - 1 ? 'text-white font-medium' : 'text-gray-500'}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <h1 className="text-sm font-medium text-white">{pageInfo.title}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-52 pl-9 pr-4 py-2 bg-[#111] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-md bg-[#111] border border-[#222] text-gray-400 hover:text-white hover:border-[#333] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
        </button>

        {/* Quick Action */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-black text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>
    </header>
  );
}
