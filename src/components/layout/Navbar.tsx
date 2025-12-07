'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Container } from './Container';
import { Button } from '../ui/Button';
import { UserMenu } from '../ui/UserMenu';
import { 
  Menu, 
  X, 
  Key, 
  Code, 
  Crown, 
  Home,
  MessageCircle,
  LogIn,
  Loader2,
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/get-key', label: 'Get Key', icon: Key },
  { href: '/scripts', label: 'Scripts', icon: Code },
  { href: '/premium', label: 'Premium', icon: Crown },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <span className="text-lg font-bold text-[var(--background)]">6</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-[var(--text)]">six</span>
              <span className="text-[var(--primary)]">sense</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isActive 
                      ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background-card)]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Discord & Login/UserMenu */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="https://discord.gg/sixsense"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Discord
            </Link>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
              </div>
            ) : session ? (
              <UserMenu />
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<LogIn className="w-4 h-4" />}
                onClick={() => signIn('discord')}
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text)]"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border)]">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-all duration-150
                      ${isActive 
                        ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--background-card)]'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="border-t border-[var(--border)] my-2" />
              <Link
                href="https://discord.gg/sixsense"
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-secondary)]"
              >
                <MessageCircle className="w-5 h-5" />
                Discord
              </Link>
              <div className="px-4 pt-2">
                {session ? (
                  <div className="flex items-center justify-center">
                    <UserMenu />
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<LogIn className="w-4 h-4" />}
                    onClick={() => signIn('discord')}
                  >
                    Login with Discord
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </nav>
  );
}

export default Navbar;
