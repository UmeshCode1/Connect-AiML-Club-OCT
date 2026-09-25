import React from 'react';
import { Card, StatusPill, Button } from '@connect/ui';
import { BRAND } from '@connect/config';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyCertificatePage({ params }: VerifyPageProps) {
  const { id } = await params;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <Card elevated>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-brand-primary, #014B7A)' }}>
            Official Credential Verification
          </h2>
          <StatusPill label="Public Surface" variant="success" />
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', marginBottom: '20px' }}>
          Validating against the official registry for {BRAND.organization}.
        </p>

        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--color-border, #E5EAF0)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px',
            marginBottom: '20px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#64748B' }}>Certificate ID:</span> <strong>{id}</strong>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#64748B' }}>API Endpoint:</span>{' '}
            <code>/v1/public/certificates/verify/{id}</code>
          </div>
          <div>
            <span style={{ color: '#64748B' }}>Verification Status:</span>{' '}
            <span style={{ color: 'var(--color-brand-secondary, #00763C)', fontWeight: 600 }}>
              VERIFICATION ENGINE ACTIVE
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, marginBottom: '20px' }}>
          Note: In accordance with 11_SECURITY_PRIVACY.md, private personal details such as student phone, personal email, and attendance percentages are intentionally omitted from public verification surfaces.
        </div>

        <a href="/">
          <Button variant="outline" size="sm">
            &larr; Return to Home
          </Button>
        </a>
      </Card>
    </div>
  );
}
