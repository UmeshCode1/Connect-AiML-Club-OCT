import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AIML CLUB OCT — Admin Console',
  description: 'Operational and event administration portal for AIML Club OCT.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          backgroundColor: '#111820',
          borderBottom: '1px solid #1E293B',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#014B7A', letterSpacing: '-0.02em' }}>
                AIML CLUB OCT <span style={{ color: '#94A3B8', fontWeight: 500 }}>| ADMIN</span>
              </span>
            </Link>
            <span style={{
              backgroundColor: '#014B7A22',
              color: '#38BDF8',
              border: '1px solid #014B7A55',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              PORTAL v1.1
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link href="/" style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 500 }}>
              Overview
            </Link>
            <Link href="/events" style={{ color: '#38BDF8', fontSize: '0.9rem', fontWeight: 600 }}>
              Events
            </Link>
            <Link href="/chronicle" style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 500 }}>
              Chronicle
            </Link>
            <Link href="/journey" style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 500 }}>
              Journey
            </Link>
            <Link href="/events/new" style={{
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}>
              + Create Event
            </Link>
          </nav>
        </header>

        <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>

        <footer style={{
          padding: '20px 24px',
          borderTop: '1px solid #1E293B',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#64748B'
        }}>
          AIML CLUB OCT — CONNECT Admin Console • Confidential Administrative Interface • WCAG 2.2 AA Compliant
        </footer>
      </body>
    </html>
  );
}
