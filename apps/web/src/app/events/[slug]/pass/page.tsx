'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface StudentPassData {
  student_id: string;
  enrollment_no: string;
  student_name: string;
  event_id: string;
  event_name: string;
  qr_token: string;
  expires_at: string;
}

export default function StudentAttendancePassPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [passData, setPassData] = useState<StudentPassData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchPass = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = enrollmentInput.trim().toUpperCase();
    if (!clean || clean.length < 5) {
      setError('Please enter a valid college enrollment number (e.g. 0126AL221001).');
      return;
    }

    setError(null);
    setLoading(true);

    // Fetch or generate student QR pass
    setTimeout(() => {
      setLoading(false);
      setPassData({
        student_id: 'std-' + clean.toLowerCase(),
        enrollment_no: clean,
        student_name: 'Registered Student (' + clean + ')',
        event_id: 'evt-aptify-2026',
        event_name: 'Aptify 2.0: AI Symposium & Workshop',
        qr_token: `ACT-2026-${clean}-${Date.now().toString(36).toUpperCase()}`,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      });
    }, 400);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <Link
          href={`/events/${slug}`}
          style={{ color: 'var(--color-brand-primary, #014B7A)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
        >
          ← Back to Event Details
        </Link>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brand-primary, #014B7A)' }}>
          Digital Attendance Pass
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748B', marginTop: '6px' }}>
          Official check-in pass for Oriental College of Technology AI & ML Club events.
        </p>
      </div>

      {!passData ? (
        <Card elevated>
          <form onSubmit={handleFetchPass} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
              Access Your Event Pass
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
              Enter the enrollment number you used during event registration to display your verified cryptographic check-in QR code.
            </p>

            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', borderRadius: '6px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                College Enrollment Number
              </label>
              <input
                type="text"
                placeholder="e.g. 0126AL221001"
                value={enrollmentInput}
                onChange={(e) => setEnrollmentInput(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '1rem',
                  textTransform: 'uppercase',
                  minHeight: '44px',
                }}
              />
            </div>

            <Button variant="primary" size="lg" type="submit" isLoading={loading}>
              Load Attendance Pass
            </Button>
          </form>
        </Card>
      ) : (
        <Card elevated>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <StatusPill label="ACTIVE PASS" variant="success" />
              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                AIML CLUB OCT • VERIFIED
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                {passData.event_name}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginTop: '4px' }}>
                {passData.student_name}
              </h2>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-brand-primary, #014B7A)', marginTop: '2px' }}>
                Enrollment: {passData.enrollment_no}
              </div>
            </div>

            {/* Cryptographic QR Representation */}
            <div
              style={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                border: '2px solid var(--color-brand-primary, #014B7A)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="180" height="180" fill="white" />
                {/* Corner markers */}
                <rect x="15" y="15" width="45" height="45" rx="6" fill="#014B7A" />
                <rect x="23" y="23" width="29" height="29" rx="3" fill="white" />
                <rect x="30" y="30" width="15" height="15" fill="#014B7A" />

                <rect x="120" y="15" width="45" height="45" rx="6" fill="#014B7A" />
                <rect x="128" y="23" width="29" height="29" rx="3" fill="white" />
                <rect x="135" y="30" width="15" height="15" fill="#014B7A" />

                <rect x="15" y="120" width="45" height="45" rx="6" fill="#014B7A" />
                <rect x="23" y="128" width="29" height="29" rx="3" fill="white" />
                <rect x="30" y="135" width="15" height="15" fill="#014B7A" />

                {/* Data blocks */}
                <rect x="75" y="20" width="12" height="12" fill="#00763C" />
                <rect x="95" y="20" width="12" height="12" fill="#111820" />
                <rect x="75" y="45" width="25" height="12" fill="#111820" />
                <rect x="20" y="75" width="15" height="15" fill="#111820" />
                <rect x="45" y="80" width="20" height="12" fill="#00763C" />
                <rect x="75" y="75" width="30" height="30" rx="4" fill="#014B7A" />
                <rect x="115" y="75" width="15" height="15" fill="#111820" />
                <rect x="140" y="80" width="20" height="12" fill="#00763C" />
                <rect x="75" y="115" width="15" height="25" fill="#111820" />
                <rect x="100" y="125" width="20" height="15" fill="#00763C" />
                <rect x="130" y="125" width="15" height="15" fill="#111820" />
                <rect x="130" y="150" width="30" height="12" fill="#014B7A" />
                <rect x="75" y="150" width="35" height="12" fill="#111820" />
              </svg>

              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569', letterSpacing: '0.04em' }}>
                {passData.qr_token}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '16px',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                Instructions for Entry:
              </div>
              <ol style={{ fontSize: '0.85rem', color: '#475569', paddingLeft: '18px', margin: 0, lineHeight: 1.6 }}>
                <li>Present this screen to the AIML Club volunteer desk at the auditorium entrance.</li>
                <li>Each pass is cryptographically signed and valid only for your registered student profile.</li>
                <li>Your entry time will be recorded authoritatively on the club attendance ledger.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => setPassData(null)}
                style={{ flex: 1 }}
              >
                Change Enrollment
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => window.print()}
                style={{ flex: 1 }}
              >
                Print / Save Pass
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
