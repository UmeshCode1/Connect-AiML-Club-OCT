import type { Metadata } from 'next';
import './globals.css';
import { BRAND } from '@connect/config';

export const metadata: Metadata = {
  title: 'Connect Administration | AIML Club OCT',
  description: 'Administrative portal for AI & Machine Learning Club, Oriental College of Technology, Bhopal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0B0F14', color: '#F1F5F9' }}>
        <header
          style={{
            borderBottom: '1px solid #1E293B',
            backgroundColor: '#111820',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#38BDF8' }}>
              CONNECT ADMIN
            </span>
            <span style={{ fontSize: '0.75rem', backgroundColor: '#1E293B', padding: '2px 8px', borderRadius: '4px' }}>
              {BRAND.adminDomain}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#94A3B8' }}>
            RBAC Enforced • Server Authorization Required
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
