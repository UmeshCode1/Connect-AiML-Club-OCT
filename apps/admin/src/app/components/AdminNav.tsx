'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Overview', exact: true },
    { href: '/events', label: 'Events' },
    { href: '/projects', label: 'Projects' },
    { href: '/research', label: 'Research' },
    { href: '/learning', label: 'Learning' },
    { href: '/chronicle', label: 'Chronicle' },
    { href: '/journey', label: 'Journey' },
  ];

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
      {links.map((link) => {
        const isActive = link.exact
          ? pathname === '/'
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              color: isActive ? '#38BDF8' : '#94A3B8',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              borderBottom: isActive ? '2px solid #38BDF8' : '2px solid transparent',
              paddingBottom: '2px',
              transition: 'color 120ms ease, border-color 120ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {link.label}
          </Link>
        );
      })}

      <Link
        href="/events/new"
        style={{
          backgroundColor: '#014B7A',
          color: '#FFFFFF',
          padding: '6px 14px',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        + Create Event
      </Link>
    </nav>
  );
}
