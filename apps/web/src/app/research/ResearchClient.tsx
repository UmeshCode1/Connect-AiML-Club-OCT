'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ResearchItem, ResearchCategory } from '@connect/types';
import { Card, Button } from '@connect/ui';

interface ResearchClientProps {
  initialResearch: ResearchItem[];
}

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Domains' },
  { value: 'AI_ML', label: 'Core AI & ML' },
  { value: 'COMPUTER_VISION', label: 'Computer Vision' },
  { value: 'NLP', label: 'Natural Language Processing' },
  { value: 'REINFORCEMENT_LEARNING', label: 'Reinforcement Learning' },
  { value: 'GENERATIVE_AI', label: 'Generative AI' },
  { value: 'ROBOTICS', label: 'Robotics' },
  { value: 'DATA_SCIENCE', label: 'Data Science' },
];

export default function ResearchClient({ initialResearch }: ResearchClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredItems = useMemo(() => {
    return initialResearch.filter((item) => {
      // Must be published and public
      if (item.visibility !== 'PUBLIC' || item.status !== 'PUBLISHED') {
        return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAbstract = item.abstract.toLowerCase().includes(q);
        const matchesAuthor = item.authors?.some((a) => a.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAbstract && !matchesAuthor) {
          return false;
        }
      }

      return true;
    });
  }, [initialResearch, search, selectedCategory]);

  const isValidUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Institutional Banner */}
      <section
        style={{
          backgroundColor: '#014B7A',
          borderRadius: '16px',
          padding: '40px 32px',
          color: '#FFFFFF',
          border: '1px solid #0369A1',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#A3E635',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          ACADEMIC REPOSITORY &amp; PAPERS
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginTop: '8px', letterSpacing: '-0.02em' }}>
          Research &amp; Technical Pre-prints
        </h1>
        <p style={{ fontSize: '1rem', color: '#E0F2FE', marginTop: '12px', lineHeight: 1.6, maxWidth: '720px' }}>
          Peer-reviewed articles, symposium workshop proceedings, and pre-prints authored by students and faculty
          mentors of the AI &amp; Machine Learning Club at Oriental College of Technology, Bhopal.
        </p>
      </section>

      {/* Filter and Search Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers by title, abstract keyword, or author name..."
            style={{
              width: '100%',
              padding: '6px 8px',
              border: 'none',
              outline: 'none',
              fontSize: '0.9375rem',
              color: '#0F172A',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCategory === cat.value ? '#014B7A' : '#E2E8F0',
                backgroundColor: selectedCategory === cat.value ? '#014B7A' : '#F8FAFC',
                color: selectedCategory === cat.value ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Research List */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '1.125rem' }}>No research papers found</p>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            No published pre-prints match your selected criteria.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('ALL');
            }}
            style={{ marginTop: '16px' }}
          >
            Clear Search &amp; Filters
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              elevated
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: '4px solid #014B7A',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {item.category.replace('_', ' ')}
                </span>
                {item.published_at && (
                  <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                    Published: {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', lineHeight: 1.3 }}>
                  <Link href={`/research/${item.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {item.title}
                  </Link>
                </h2>

                {/* Authors Attribution (Strictly Safe Public Metadata) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                  {item.authors?.map((author, idx) => (
                    <span key={idx} style={{ fontSize: '0.875rem', color: '#334155' }}>
                      <strong>{author.name}</strong>
                      {author.affiliation && (
                        <span style={{ color: '#64748B', fontSize: '0.8125rem' }}> ({author.affiliation})</span>
                      )}
                      {idx < (item.authors?.length || 0) - 1 ? ' • ' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.9375rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {item.abstract}
              </p>

              {/* Action Links */}
              <div
                style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {isValidUrl(item.publication_url) && (
                    <a
                      href={item.publication_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#014B7A', textDecoration: 'none' }}
                    >
                      📄 Read Paper (arXiv/PDF) ↗
                    </a>
                  )}
                  {isValidUrl(item.repository_url) && (
                    <a
                      href={item.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#00763C', textDecoration: 'none' }}
                    >
                      💻 Code &amp; Models ↗
                    </a>
                  )}
                  {isValidUrl(item.dataset_url) && (
                    <a
                      href={item.dataset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E', textDecoration: 'none' }}
                    >
                      📊 Benchmark Dataset ↗
                    </a>
                  )}
                </div>

                <Link href={`/research/${item.slug}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm">
                    View Full Details →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
