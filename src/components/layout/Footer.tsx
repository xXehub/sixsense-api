'use client';

import Link from 'next/link';
import { Container } from './Container';
import { Github, MessageCircle, Heart } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Get Key', href: '/get-key' },
    { label: 'Scripts', href: '/scripts' },
    { label: 'Premium', href: '/premium' },
    { label: 'Status', href: '/status' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'API', href: '/api-docs' },
  ],
  community: [
    { label: 'Discord', href: 'https://discord.gg/sixsense', external: true },
    { label: 'GitHub', href: 'https://github.com/xXehub', external: true },
    { label: 'YouTube', href: '#', external: true },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background-secondary)]">
      <Container>
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <span className="text-lg font-bold text-[var(--background)]">6</span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-[var(--text)]">six</span>
                <span className="text-[var(--primary)]">sense</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Premium Roblox scripts with powerful automation and protection.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://discord.gg/sixsense"
                target="_blank"
                className="p-2 rounded-lg bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--background-card-hover)] transition-all"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <Link
                href="https://github.com/xXehub"
                target="_blank"
                className="p-2 rounded-lg bg-[var(--background-card)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--background-card-hover)] transition-all"
              >
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} sixsense. All rights reserved.
          </p>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-[var(--primary)]" /> by xXehub
          </p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
