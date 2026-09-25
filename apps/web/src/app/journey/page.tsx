import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { JourneyMilestone } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

export const metadata: Metadata = {
  title: 'Institutional Journey & Timeline — AIML CLUB OCT',
  description: 'Historical milestones, achievements, inaugurations, and institutional collaborations of the AI & Machine Learning Club, Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Institutional Journey & Timeline — AIML CLUB OCT',
    description: 'Documenting the growth, key milestones, and achievements of AIML CLUB OCT.',
  },
};

async function getMilestones(): Promise<JourneyMilestone[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/journey?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch {
    // Offline fallback for build
  }

  return [
    {
      id: '00000000-0000-0000-0000-000000000801',
      title: 'Foundation of AI & ML Club, Oriental College of Technology',
      slug: 'foundation-of-aiml-club-oct',
      milestone_date: '2024-08-15',
      milestone_type: 'FOUNDATION',
      description: 'Establishment of the dedicated AI & Machine Learning student chapter at Oriental College of Technology, Bhopal under the leadership of student coordinators and institutional faculty advisors.',
      external_link: 'https://aimlcluboct.in',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      display_order: 0,
      published_at: '2024-08-15T12:00:00Z',
      created_at: '2024-08-15T12:00:00Z',
      updated_at: '2024-08-15T12:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000802',
      title: 'Inauguration of Aptify AI Symposium Series',
      slug: 'inauguration-of-aptify-series',
      milestone_date: '2025-02-20',
      milestone_type: 'EVENT',
      description: 'Launch of the flagship technical symposium uniting students, faculty, and industry professionals in AI engineering, computer vision, and machine learning research tracks.',
      linked_event_id: '00000000-0000-0000-0000-000000000101',
      linked_event_title: 'Aptify 2.0: AI Symposium',
      linked_event_slug: 'aptify-2026',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      display_order: 1,
      published_at: '2025-02-20T10:00:00Z',
      created_at: '2025-02-20T10:00:00Z',
      updated_at: '2025-02-20T10:00:00Z',
    },
  ];
}

export default async function JourneyTimelinePage() {
  const milestones = await getMilestones();

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '24px',
        marginBottom: '40px',
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#00763C15',
          color: '#00763C',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}>
          Institutional Memory
        </div>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#0F172A',
          margin: '0 0 10px 0',
          letterSpacing: '-0.02em',
        }}>
          The Journey of AIML CLUB OCT
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#475569',
          maxWidth: '720px',
          margin: 0,
          lineHeight: '1.6',
        }}>
          A historical chronicle of foundational milestones, technical accomplishments, symposium inaugurations, and community partnerships shaping machine learning at Oriental College of Technology.
        </p>
      </div>

      {/* Timeline Stream */}
      {milestones.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          color: '#64748B',
        }}>
          No historical milestones recorded yet.
        </div>
      ) : (
        <div style={{
          position: 'relative',
          paddingLeft: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}>
          {/* Vertical Timeline Rule */}
          <div style={{
            position: 'absolute',
            left: '11px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            backgroundColor: '#CBD5E1',
          }} />

          {milestones.map((ms) => (
            <div key={ms.id} style={{ position: 'relative' }}>
              {/* Timeline Bullet Node */}
              <div style={{
                position: 'absolute',
                left: '-32px',
                top: '6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#014B7A',
                border: '4px solid #FFFFFF',
                boxShadow: '0 0 0 2px #014B7A',
              }} />

              {/* Card Container */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      backgroundColor: '#014B7A12',
                      color: '#014B7A',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {ms.milestone_type}
                    </span>
                    <time style={{ fontSize: '0.9rem', fontWeight: 700, color: '#00763C' }}>
                      {new Date(ms.milestone_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </div>

                <h2 style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: '0 0 10px 0',
                  lineHeight: '1.3',
                }}>
                  {ms.title}
                </h2>

                <p style={{
                  fontSize: '0.95rem',
                  color: '#334155',
                  lineHeight: '1.6',
                  margin: '0 0 16px 0',
                }}>
                  {ms.description}
                </p>

                {/* Canonical Event Link */}
                {ms.linked_event_id && (
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    <span>
                      Associated Campus Event:{' '}
                      <strong style={{ color: '#014B7A' }}>
                        {ms.linked_event_title || ms.linked_event_id}
                      </strong>
                    </span>
                    {ms.linked_event_slug && (
                      <Link
                        href={`/events/${ms.linked_event_slug}`}
                        style={{
                          color: '#014B7A',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        View Event →
                      </Link>
                    )}
                  </div>
                )}

                {/* External Link if applicable */}
                {ms.external_link && (ms.external_link.startsWith('http://') || ms.external_link.startsWith('https://')) && (
                  <div style={{ marginTop: '12px' }}>
                    <a
                      href={ms.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.85rem',
                        color: '#00763C',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Official Reference Documentation ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
