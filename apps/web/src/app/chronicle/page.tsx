import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ChronicleEntry } from '@connect/types';

export const metadata: Metadata = {
  title: 'Chronicle — AIML CLUB OCT',
  description: 'Official publications, research digests, monthly editorial updates, and symposium recaps from AI & Machine Learning Club, Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Chronicle — AIML CLUB OCT',
    description: 'Official digital publications and research digests from the AI & Machine Learning Club.',
  },
};

async function getChronicles(): Promise<ChronicleEntry[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${apiUrl}/v1/chronicle?page_size=30`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch {
    // Graceful fallback for offline build
  }

  return [
    {
      id: '00000000-0000-0000-0000-000000000701',
      title: 'Welcome to AIML Club Chronicle: Academic Year 2026',
      slug: 'welcome-to-aiml-club-chronicle-2026',
      edition_type: 'INSTITUTIONAL_ANNOUNCEMENT',
      excerpt: 'Official inaugurative edition of AIML CLUB OCT Chronicle covering key milestones, upcoming symposiums, and student research tracks.',
      content: '# Welcome to AIML Club Chronicle\n\nInnovate. Implement. Inspire.\n\nWe are pleased to introduce the official digital chronicle of AIML CLUB OCT.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      published_at: '2026-03-01T10:00:00Z',
      created_at: '2026-03-01T09:00:00Z',
      updated_at: '2026-03-01T10:00:00Z',
      linked_events: [
        {
          id: 'item-1',
          chronicle_id: '00000000-0000-0000-0000-000000000701',
          event_id: '00000000-0000-0000-0000-000000000101',
          display_order: 0,
          event_title: 'Aptify 2.0: AI Symposium',
          event_slug: 'aptify-2026',
        },
      ],
    },
  ];
}

export default async function ChronicleIndexPage() {
  const entries = await getChronicles();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header Banner */}
      <div style={{
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '28px',
        marginBottom: '40px',
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#014B7A15',
          color: '#014B7A',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Editorial Archive
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#0F172A',
          margin: '0 0 10px 0',
          letterSpacing: '-0.02em',
        }}>
          AIML Club Chronicle
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#475569',
          maxWidth: '750px',
          margin: 0,
          lineHeight: '1.6',
        }}>
          The official periodical publication of the AI & Machine Learning Club, Oriental College of Technology Bhopal. Exploring academic research, engineering highlights, and student achievements.
        </p>
      </div>

      {/* Publications Stream */}
      {entries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          color: '#64748B',
        }}>
          No published Chronicle editions available at this time.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '30px',
        }}>
          {entries.map((entry) => (
            <article
              key={entry.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#014B7A',
                  backgroundColor: '#014B7A11',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {entry.edition_type.replace(/_/g, ' ')}
                </span>
                <time style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  {new Date(entry.published_at || entry.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </div>

              <h2 style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#0F172A',
                margin: '0 0 10px 0',
                lineHeight: '1.3',
              }}>
                <Link
                  href={`/chronicle/${entry.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {entry.title}
                </Link>
              </h2>

              {entry.excerpt && (
                <p style={{
                  fontSize: '0.92rem',
                  color: '#475569',
                  lineHeight: '1.5',
                  margin: '0 0 16px 0',
                  flex: 1,
                }}>
                  {entry.excerpt}
                </p>
              )}

              {entry.linked_events && entry.linked_events.length > 0 && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#00763C',
                  backgroundColor: '#00763C10',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                }}>
                  Referenced Event:{' '}
                  <strong>{entry.linked_events[0].event_title || 'Campus Event'}</strong>
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <Link
                  href={`/chronicle/${entry.slug}`}
                  style={{
                    color: '#014B7A',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Read Publication →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
