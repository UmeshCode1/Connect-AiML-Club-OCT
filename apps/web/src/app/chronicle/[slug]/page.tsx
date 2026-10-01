import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ChronicleEntry } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchChronicle(slug: string): Promise<ChronicleEntry | null> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/chronicle/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.error('Failed to fetch chronicle entry from API:', err);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await fetchChronicle(slug);
  if (!entry) {
    return {
      title: 'Publication Not Found — AIML CLUB OCT',
    };
  }

  const title = entry.seo_title || `${entry.title} — Chronicle`;
  const description = entry.seo_description || entry.excerpt || 'Official publication by AIML CLUB OCT';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: entry.published_at,
    },
  };
}

export default async function ChronicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await fetchChronicle(slug);

  if (!entry) {
    notFound();
  }

  return (
    <article style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/chronicle"
          style={{
            color: '#014B7A',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Chronicle Archive
        </Link>
      </div>

      {/* Article Header */}
      <header style={{
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#014B7A',
            backgroundColor: '#014B7A15',
            padding: '3px 10px',
            borderRadius: '4px',
            textTransform: 'uppercase',
          }}>
            {entry.edition_type.replace(/_/g, ' ')}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            {new Date(entry.published_at || entry.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#0F172A',
          margin: '0 0 16px 0',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        }}>
          {entry.title}
        </h1>

        {entry.excerpt && (
          <p style={{
            fontSize: '1.15rem',
            color: '#334155',
            lineHeight: '1.6',
            margin: 0,
            fontStyle: 'italic',
            borderLeft: '4px solid #014B7A',
            paddingLeft: '16px',
          }}>
            {entry.excerpt}
          </p>
        )}
      </header>

      {/* Main Content Body */}
      <div style={{
        fontSize: '1.05rem',
        lineHeight: '1.8',
        color: '#1E293B',
        marginBottom: '40px',
        whiteSpace: 'pre-wrap',
      }}>
        {entry.content}
      </div>

      {/* Canonical Linked Events */}
      {entry.linked_events && entry.linked_events.length > 0 && (
        <section style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '24px',
          marginTop: '40px',
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0' }}>
            Referenced Campus Events
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entry.linked_events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#014B7A', fontSize: '1rem' }}>
                    {ev.event_title || 'Campus Event'}
                  </div>
                  {ev.venue && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      Venue: {ev.venue}
                    </div>
                  )}
                </div>

                {ev.event_slug && (
                  <Link
                    href={`/events/${ev.event_slug}`}
                    style={{
                      backgroundColor: '#014B7A',
                      color: '#FFFFFF',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    View Event Details
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Institutional Footer */}
      <footer style={{
        marginTop: '60px',
        paddingTop: '20px',
        borderTop: '1px solid #E2E8F0',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748B',
      }}>
        Published by the Editorial Board of AI & Machine Learning Club • Oriental College of Technology Bhopal
      </footer>
    </article>
  );
}
