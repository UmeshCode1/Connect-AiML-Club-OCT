'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface MatchedPhoto {
  id: string;
  title: string;
  original_filename: string;
  google_drive_file_id: string;
  confidence_tier: 'HIGH' | 'MEDIUM';
  similarity_score: number;
}

const MOCK_MATCHES: MatchedPhoto[] = [
  {
    id: 'med-01',
    title: 'Aptify 2026 Keynote Stage',
    original_filename: 'aptify_keynote_stage.jpg',
    google_drive_file_id: '1DriveFileAptifyKeynotePhoto001',
    confidence_tier: 'HIGH',
    similarity_score: 0.89,
  },
  {
    id: 'med-02',
    title: 'Deep Learning Workshop Lab Hall',
    original_filename: 'dl_workshop_hall.jpg',
    google_drive_file_id: '1DriveFileAptifyWorkshopLab002',
    confidence_tier: 'MEDIUM',
    similarity_score: 0.78,
  },
];

export default function StudentPhotoDiscoveryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [hasConsent, setHasConsent] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [enrollmentInput, setEnrollmentInput] = useState('0126AL221001');
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState<MatchedPhoto[]>([]);
  const [disputedIds, setDisputedIds] = useState<string[]>([]);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;
    setHasConsent(true);
    setSearched(false);
  };

  const handleWithdrawConsent = () => {
    setHasConsent(false);
    setAgreedTerms(false);
    setSearched(false);
    setMatches([]);
    setReportSuccessMessage('Biometric consent withdrawn. Enrolled embedding vectors have been permanently deleted.');
  };

  const handleSearch = () => {
    setSearched(true);
    setMatches(MOCK_MATCHES.filter((m) => !disputedIds.includes(m.id)));
  };

  const handleReportNotMe = (photoId: string, title: string) => {
    setDisputedIds((prev) => [...prev, photoId]);
    setMatches((prev) => prev.filter((m) => m.id !== photoId));
    setReportSuccessMessage(`"Not Me" dispute recorded for "${title}". The photo has been removed from your gallery and queued for administrative review.`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation */}
      <div>
        <Link
          href={`/events/${slug}`}
          style={{ color: 'var(--color-brand-primary, #014B7A)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
        >
          ← Back to Event Details
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-brand-primary, #014B7A)' }}>
          Event Memories & Photo Discovery
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748B', marginTop: '6px' }}>
          AI-assisted personal photo discovery for verified attendees of Oriental College of Technology club events.
        </p>
      </div>

      {reportSuccessMessage && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #10B981',
            borderRadius: '8px',
            padding: '14px 18px',
            color: '#065F46',
            fontSize: '0.9rem',
          }}
        >
          ✓ {reportSuccessMessage}
        </div>
      )}

      {/* Biometric Consent Privacy Gate */}
      <Card elevated>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>
              Biometric Privacy & Consent Gate
            </h2>
            <StatusPill
              label={hasConsent ? 'CONSENT ACTIVE (v1.0)' : 'OPT-IN REQUIRED'}
              variant={hasConsent ? 'success' : 'neutral'}
            />
          </div>

          <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
            <p>
              AIML Club OCT protects student privacy by default. Photo discovery uses biometric facial embeddings solely to find photos of you from events you attended.
            </p>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><strong>Strictly Opt-in:</strong> We never process your face vectors without your explicit permission.</li>
              <li><strong>Zero Public Inference:</strong> Unknown faces are never identified or indexed publicly.</li>
              <li><strong>Right to Withdraw:</strong> You can withdraw consent and hard-delete your stored vectors at any time.</li>
              <li><strong>Event-Scoped:</strong> Searches cannot cross into events where you were not registered.</li>
            </ul>
          </div>

          {!hasConsent ? (
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="consent_checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: '4px', width: '18px', height: '18px' }}
                />
                <label htmlFor="consent_checkbox" style={{ fontSize: '0.85rem', color: '#334155' }}>
                  I explicitly opt in to biometric facial discovery (Consent Version v1.0). I understand that a mathematical embedding vector will be generated solely to help me discover my photos from attended club events.
                </label>
              </div>

              <div>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={!agreedTerms}
                >
                  Confirm Opt-In & Enable Discovery
                </Button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.85rem', color: '#00763C', fontWeight: 600 }}>
                ✓ Enrolled as {enrollmentInput} • Privacy Protected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdrawConsent}
              >
                Withdraw Consent & Purge Vectors
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Photo Discovery Section (Active when consented) */}
      {hasConsent && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B' }}>
                  My Event Photos
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>
                  Event-scoped search across official media assets for <code>{slug}</code>.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSearch}
              >
                🔍 Search My Photos
              </Button>
            </div>

            {searched && (
              <div>
                {matches.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '8px', color: '#64748B' }}>
                    <p style={{ fontWeight: 600 }}>No matching photos found in this event.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      More media is uploaded and processed following event conclusion.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {matches.map((photo) => (
                      <div
                        key={photo.id}
                        style={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Placeholder graphic simulating Google Drive photo preview */}
                        <div
                          style={{
                            height: '180px',
                            backgroundColor: '#0F172A',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94A3B8',
                            position: 'relative',
                          }}
                        >
                          <span style={{ fontSize: '2rem' }}>📸</span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginTop: '6px' }}>
                            {photo.google_drive_file_id}
                          </span>
                          <div
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                            }}
                          >
                            <StatusPill
                              label={`${photo.confidence_tier} MATCH`}
                              variant={photo.confidence_tier === 'HIGH' ? 'success' : 'neutral'}
                            />
                          </div>
                        </div>

                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                              {photo.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>
                              {photo.original_filename} • Score: {photo.similarity_score}
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => handleReportNotMe(photo.id, photo.title)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px',
                              }}
                            >
                              🚩 Report: Not Me
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
