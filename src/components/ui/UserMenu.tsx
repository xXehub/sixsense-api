'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, 
  LogOut, 
  Settings, 
  Key, 
  LayoutDashboard,
  ChevronDown,
  Crown,
  Shield,
} from 'lucide-react';
import { ADMIN_DISCORD_IDS } from '@/lib/admin';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--background-card)] animate-pulse" />
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as {
    name?: string;
    email?: string;
    image?: string;
    discordId?: string;
    username?: string;
    avatar?: string;
  };

  const avatarUrl = user.avatar || user.image || null;
  const displayName = user.username || user.name || 'User';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 p-1.5 pr-3 rounded-full
          bg-[var(--background-card)] border border-[var(--border)]
          hover:border-[var(--primary)] transition-all
          ${isOpen ? 'border-[var(--primary)]' : ''}
        `}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full bg-[var(--background-elevated)] overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
        
        {/* Name */}
        <span className="text-sm font-medium text-[var(--text)] hidden sm:block max-w-[100px] truncate">
          {displayName}
        </span>
        
        {/* Chevron */}
        <ChevronDown 
          className={`
            w-4 h-4 text-[var(--text-muted)] transition-transform
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--background-elevated)] overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">
                  {displayName}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {user.email || `@${user.username}`}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/keys"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              <Key className="w-4 h-4" />
              My Keys
            </Link>
            {user.discordId && ADMIN_DISCORD_IDS.includes(user.discordId) && (
              <Link
                href="/x-admin-panel"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--background-elevated)] transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            )}
            <Link
              href="/premium"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              <Crown className="w-4 h-4" />
              Premium
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-[var(--border)] py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-sm text-[var(--error)] hover:bg-[var(--background-elevated)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
