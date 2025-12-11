'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Gamepad2, 
  Settings,
  LogOut,
  Activity,
  Bell,
  FileText,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Shield,
  UserPlus,
  UserCheck,
  KeyRound,
  History,
  Zap,
  Crown,
  Star,
  Code
} from 'lucide-react';

interface MenuItem {
  name: string;
  href?: string;
  icon: any;
  description?: string;
  children?: { name: string; href: string; icon: any }[];
}

const menuItems: MenuItem[] = [
  { 
    name: 'Dashboard', 
    href: '/x-admin-panel', 
    icon: LayoutDashboard,
  },
  { 
    name: 'Users', 
    icon: Users,
    children: [
      { name: 'All Users', href: '/x-admin-panel/users', icon: Users },
      { name: 'Premium Users', href: '/x-admin-panel/users?filter=premium', icon: Crown },
      { name: 'Banned Users', href: '/x-admin-panel/users?filter=banned', icon: Shield },
    ]
  },
  { 
    name: 'License Keys', 
    icon: Key,
    children: [
      { name: 'All Keys', href: '/x-admin-panel/keys', icon: Key },
      { name: 'Active Keys', href: '/x-admin-panel/keys?filter=active', icon: Zap },
      { name: 'Key History', href: '/x-admin-panel/keys?filter=history', icon: History },
    ]
  },
  { 
    name: 'Games', 
    href: '/x-admin-panel/games', 
    icon: Gamepad2,
  },
  { 
    name: 'Protected Scripts', 
    href: '/x-admin-panel/scripts', 
    icon: Code,
  },
  { 
    name: 'Analytics', 
    icon: Activity,
    children: [
      { name: 'Activity Logs', href: '/x-admin-panel/logs', icon: Activity },
      { name: 'Reports', href: '/x-admin-panel/reports', icon: FileText },
    ]
  },
  { 
    name: 'Notifications', 
    href: '/x-admin-panel/notifications', 
    icon: Bell,
  },
  { 
    name: 'Settings', 
    href: '/x-admin-panel/settings', 
    icon: Settings,
  },
  { 
    name: 'Help', 
    href: '/x-admin-panel/help', 
    icon: HelpCircle,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Users', 'License Keys', 'Analytics']);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  const isMenuActive = (item: MenuItem) => {
    if (item.href) return pathname === item.href;
    if (item.children) return item.children.some(child => pathname.startsWith(child.href.split('?')[0]));
    return false;
  };

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
      {/* Logo - matches public navbar sizing */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1a1a1a]">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-lg font-bold text-black">6</span>
        </div>
        <span className="text-xl font-bold">
          <span className="text-white">six</span>
          <span className="text-primary">sense</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 overflow-y-auto">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = isMenuActive(item);
            const isExpanded = expandedMenus.includes(item.name);
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                      transition-all duration-150
                      ${isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'text-gray-400 hover:bg-[#151515] hover:text-white'
                      }
                    `}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                    ) : (
                      <ChevronRight className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-3 pl-3 border-l border-[#1a1a1a] space-y-1">
                      {item.children!.map((child) => {
                        const isChildActive = pathname === child.href.split('?')[0] || pathname.startsWith(child.href.split('?')[0]);
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`
                              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium
                              transition-all duration-150
                              ${isChildActive 
                                ? 'bg-primary/15 text-primary border border-primary/30' 
                                : 'text-gray-400 hover:bg-[#151515] hover:text-white'
                              }
                            `}
                          >
                            <child.icon className={`h-3.5 w-3.5 ${isChildActive ? 'text-primary' : 'text-gray-500'}`} />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-150
                  ${isActive 
                    ? 'bg-primary/15 text-primary border border-primary/30' 
                    : 'text-gray-400 hover:bg-[#151515] hover:text-white'
                  }
                `}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-gray-500'}`} />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section */}
      <div className="p-3 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-3 p-3 rounded-md bg-[#111]">
          <img
            src={session?.user?.image || '/default-avatar.png'}
            alt=""
            className="h-10 w-10 rounded-md object-cover border border-[#2a2a2a]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {session?.user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
