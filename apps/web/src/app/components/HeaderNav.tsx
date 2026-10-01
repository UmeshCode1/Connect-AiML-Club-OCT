'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CommandPalette } from './CommandPalette';

export function HeaderNav() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/events', label: 'Events' },
    { href: '/projects', label: 'Projects' },
    { href: '/research', label: 'Research' },
    { href: '/learning', label: 'Learning' },
    { href: '/chronicle', label: 'Chronicle' },
    { href: '/journey', label: 'Journey' },
    { href: '/verify/smoke-check', label: 'Verify' },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Search Trigger Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open search command palette (Ctrl+K)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            minHeight: '38px',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            backgroundColor: '#F8FAFC',
            color: '#64748B',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ display: 'inline' }}>Search...</span>
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              color: '#475569',
            }}
          >
            Ctrl K
          </kbd>
        </button>

        {/* Desktop Nav Links */}
        <nav
          className="desktop-only"
          aria-label="Main Navigation"
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            fontSize: '0.9375rem',
            fontWeight: 500,
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#014B7A' : '#334155',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  borderBottom: isActive ? '2px solid #014B7A' : '2px solid transparent',
                  paddingBottom: '2px',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/auth"
            style={{
              padding: '6px 14px',
              minHeight: '36px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '8px',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Sign In
          </Link>
        </nav>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
