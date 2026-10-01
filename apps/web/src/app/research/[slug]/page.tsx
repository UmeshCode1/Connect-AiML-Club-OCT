import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { ResearchItem } from '@connect/types';
import { Card, Button } from '@connect/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchResearchItem(slug: string): Promise<ResearchItem | null> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/research/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const item: ResearchItem = body.data;
      if (!item) return null;
      // Guardrail: Draft or private research MUST NOT be accessible
      if (item.visibility !== 'PUBLIC' || item.status !== 'PUBLISHED') {
        return null;
      }
      return item;
    }
  } catch (err) {
    console.error('Failed to fetch research item from API:', err);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchResearchItem(slug);
  if (!item) {
    return { title: 'Research Not Found | AIML CLUB OCT' };
  }
  return {
    title: `${item.title} — AIML CLUB OCT Research`,
    description: item.abstract,
    openGraph: {
      title: `${item.title} — AIML CLUB OCT Research`,
      description: item.abstract,
    },
  };
}

export default async function ResearchDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = await fetchResearchItem(slug);

  if (!item) {
    notFound();
  }

  const isValidUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/research"
          style={{
            fontSize: '0.875rem',
            color: '#014B7A',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Research Directory
        </Link>
      </div>

      {/* Header Article Lockup */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: '9999px',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              textTransform: 'uppercase',
            }}
          >
            {item.category.replace('_', ' ')}
          </span>
          {item.published_at && (
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Published: {new Date(item.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#014B7A', lineHeight: 1.3 }}>
          {item.title}
        </h1>

        {/* Authors List (Strictly Safe Public Metadata) */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>
            Authors &amp; Institutional Attribution
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {item.authors?.map((a, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{a.name}</div>
                {a.role && <div style={{ fontSize: '0.75rem', color: '#0369A1' }}>{a.role}</div>}
                {a.affiliation && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{a.affiliation}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Direct Artifact Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          {isValidUrl(item.publication_url) && (
            <a href={item.publication_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary">📄 Open Full Paper (arXiv/PDF)</Button>
            </a>
          )}
          {isValidUrl(item.repository_url) && (
            <a href={item.repository_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">💻 Open Code &amp; Models</Button>
            </a>
          )}
          {isValidUrl(item.dataset_url) && (
            <a href={item.dataset_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="outline">📊 Benchmark Dataset</Button>
            </a>
          )}
        </div>
      </section>

      {/* Abstract Section */}
      <Card elevated style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', marginBottom: '12px' }}>
          Abstract
        </h2>
        <p style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, margin: 0 }}>
          {item.abstract}
        </p>
      </Card>

      {/* Methodology Section */}
      {item.methodology && (
        <Card elevated style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', marginBottom: '12px' }}>
            Experimental Methodology &amp; Benchmarks
          </h2>
          <div style={{ fontSize: '0.9375rem', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {item.methodology}
          </div>
        </Card>
      )}

      {/* Linked Project / Event Association */}
      {(item.linked_event_title || item.linked_project_title) && (
        <Card elevated style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#014B7A', marginBottom: '12px' }}>
            Associated Institutional Deliverables
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            {item.linked_project_title && (
              <div>
                <span style={{ color: '#64748B' }}>Originating Project: </span>
                <strong style={{ color: '#0369A1' }}>{item.linked_project_title}</strong>
              </div>
            )}
            {item.linked_event_title && (
              <div>
                <span style={{ color: '#64748B' }}>Presented at: </span>
                <strong style={{ color: '#00763C' }}>{item.linked_event_title}</strong>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
