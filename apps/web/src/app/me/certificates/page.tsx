'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button, BrandHeader, EmptyState, Input } from '@connect/ui';

interface StudentCertificate {
  id: string;
  certificate_id: string;
  certificate_type: string;
  recipient_name: string;
  event_title: string;
  event_date: string;
  issued_at: string;
  status: 'ISSUED' | 'VALID' | 'REVOKED' | 'REPLACED';
  google_drive_file_id?: string;
  verification_url: string;
}

export default function StudentCertificatesPortfolioPage() {
  const [certificates] = useState<StudentCertificate[]>([]);
  const [lookupId, setLookupId] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = lookupId.trim();
    if (clean) {
      window.location.href = `/verify/${encodeURIComponent(clean)}`;
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '36px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ color: '#014B7A', fontSize: '0.875rem', textDecoration: 'none' }}>
          &larr; Back to Member Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              My Verified Credentials
            </h1>
            <p style={{ color: '#4B5563', fontSize: '0.9rem', marginTop: '4px' }}>
              Official participation, merit, and completion certificates authenticated by AIML Club OCT.
            </p>
          </div>
          <BrandHeader showTagline={false} />
        </div>
      </div>

      {/* Manual Certificate Verification Lookup Tool */}
      <Card style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
            Look Up &amp; Authenticate Any Certificate ID
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px' }}>
              <Input
                type="text"
                placeholder="e.g. AIML26-APT-000101"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
              />
            </div>
            <Button variant="primary" type="submit" disabled={!lookupId.trim()}>
              Verify Credential →
            </Button>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Enter the unique ID printed on your physical or digital certificate to verify its cryptographic authenticity.
          </span>
        </form>
      </Card>

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates issued yet to this profile"
          description="Once you participate in club events, complete workshop labs, and satisfy attendance requirements, your verified credentials will appear here automatically."
          actionText="Explore Upcoming Events"
          actionHref="/events"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {certificates.map((cert) => (
            <Card key={cert.id} elevated style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#014B7A', textTransform: 'uppercase' }}>
                      {cert.certificate_type} CERTIFICATE
                    </span>
                    <StatusBadge status={cert.status} />
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginTop: '4px', margin: 0 }}>
                    {cert.event_title}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                    Conducted on {cert.event_date}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>
                    Certificate Number
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#014B7A', fontSize: '1rem' }}>
                    {cert.certificate_id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Issued on: {new Date(cert.issued_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a href={`/verify/${cert.certificate_id}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Public Verification Page ↗
                    </Button>
                  </a>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.open(`/verify/${cert.certificate_id}`, '_blank')}
                    style={{ backgroundColor: '#014B7A' }}
                  >
                    Download Certificate (PDF)
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
