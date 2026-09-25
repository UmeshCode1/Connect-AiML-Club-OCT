import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BRAND } from '@connect/config';
import { BrandHeader } from '@connect/ui';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.appDomain}`),
  title: {
    template: `%s | ${BRAND.name}`,
    default: `${BRAND.name} — ${BRAND.tagline}`,
  },
  description: 'Official unified operational and student-facing platform for the AI & Machine Learning Club, Oriental College of Technology, Bhopal.',
  keywords: ['AIML Club OCT', 'Oriental College of Technology', 'OCT Bhopal', 'AI Club', 'Machine Learning', 'Connect'],
  authors: [{ name: 'AIML Club OCT', url: `https://${BRAND.primaryDomain}` }],
  creator: 'AIML Club OCT',
  publisher: 'AIML Club OCT',
  manifest: '/manifest.json',
  icons: {
    icon: '/brand/aiml-club-mark-101.png',
    apple: '/brand/aiml-club-mark-101.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: `https://${BRAND.appDomain}`,
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: 'Unified digital platform for events, participants, memories, certificates, and community legacy.',
    images: [
      {
        url: '/brand/aiml-club-logo-500.png',
        width: 500,
        height: 500,
        alt: 'AIML Club OCT Logo',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#014B7A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/brand/aiml-club-mark-101.png" type="image/png" />
      </head>
      <body>
        <header
          style={{
            borderBottom: '1px solid var(--color-border, #E5EAF0)',
            backgroundColor: 'var(--color-surface-white, #FFFFFF)',
            padding: '12px 24px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: '1280px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <BrandHeader showTagline={true} />
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '0.9375rem', fontWeight: 500 }}>
              <a href="/events">Events</a>
              <a href="/verify/smoke-check">Verify</a>
              <a
                href="/auth"
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'var(--color-brand-primary, #014B7A)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </a>
            </nav>
          </div>
        </header>

        <main style={{ minHeight: 'calc(100vh - 140px)', padding: '24px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {children}
          </div>
        </main>

        <footer
          style={{
            borderTop: '1px solid var(--color-border, #E5EAF0)',
            backgroundColor: 'var(--color-surface-white, #FFFFFF)',
            padding: '24px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #5B6573)',
          }}
        >
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontWeight: 600, color: 'var(--color-brand-primary, #014B7A)' }}>
              {BRAND.organization}
            </p>
            <p>
              Official Public Website:{' '}
              <a href={`https://${BRAND.primaryDomain}`} target="_blank" rel="noopener noreferrer">
                {BRAND.primaryDomain}
              </a>{' '}
              | Subdomain Ecosystem: {BRAND.appDomain} • {BRAND.adminDomain} • {BRAND.apiDomain}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #8A95A3)' }}>
              &copy; {new Date().getFullYear()} AIML Club OCT. All rights reserved. Official Tagline: &ldquo;{BRAND.tagline}&rdquo;
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
