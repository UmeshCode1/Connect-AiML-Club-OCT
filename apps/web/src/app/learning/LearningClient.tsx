'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { LearningResource, LearningResourceType, LearningDifficultyLevel } from '@connect/types';
import { Card, Button, StatusPill } from '@connect/ui';

interface LearningClientProps {
  initialResources: LearningResource[];
}

const RESOURCE_TYPES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Formats' },
  { value: 'NOTEBOOK', label: 'Notebooks' },
  { value: 'SLIDES', label: 'Slides' },
  { value: 'DOCUMENTATION', label: 'Guides & Docs' },
  { value: 'TUTORIAL', label: 'Tutorials' },
  { value: 'DATASET', label: 'Datasets' },
  { value: 'RECORDING', label: 'Recordings' },
  { value: 'WORKSHOP_MATERIAL', label: 'Lab Materials' },
];

const DIFFICULTIES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Levels' },
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

export default function LearningClient({ initialResources }: LearningClientProps) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  const filteredResources = useMemo(() => {
    return initialResources.filter((r) => {
      if (r.visibility !== 'PUBLIC') return false;

      if (selectedType !== 'ALL' && r.resource_type !== selectedType) return false;
      if (selectedDifficulty !== 'ALL' && r.difficulty_level !== selectedDifficulty) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [initialResources, search, selectedType, selectedDifficulty]);

  const isValidUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

  const getLaunchLabel = (type: LearningResourceType) => {
    switch (type) {
      case 'NOTEBOOK':
        return '🚀 Launch in Google Colab';
      case 'SLIDES':
        return '📑 Open Slide Deck';
      case 'DOCUMENTATION':
        return '📖 Read Documentation';
      case 'DATASET':
        return '📊 Download Dataset';
      case 'RECORDING':
        return '▶ Watch Recording';
      default:
        return '↗ Open Resource';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Banner */}
      <section
        style={{
          backgroundColor: '#0F172A',
          borderRadius: '16px',
          padding: '40px 32px',
          color: '#FFFFFF',
          border: '1px solid #1E293B',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#38BDF8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          OPEN EDUCATIONAL RESOURCES
        </span>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginTop: '8px', letterSpacing: '-0.02em' }}>
          Learning Resources &amp; AI Labs
        </h1>
        <p style={{ fontSize: '1rem', color: '#94A3B8', marginTop: '12px', lineHeight: 1.6, maxWidth: '720px' }}>
          Interactive Jupyter/Colab notebooks, workshop slide decks, hands-on lab code, and datasets curated by
          technical leads of the AI &amp; Machine Learning Club at Oriental College of Technology, Bhopal.
        </p>
      </section>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
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
            placeholder="Search notebooks, slides, or topics (e.g. PyTorch, YOLO, Fine-Tuning)..."
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

        {/* Multi-tier Filter Rows */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            borderTop: '1px solid #F1F5F9',
            paddingTop: '16px',
          }}
        >
          {/* Format / Type Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {RESOURCE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedType === type.value ? '#014B7A' : '#E2E8F0',
                  backgroundColor: selectedType === type.value ? '#014B7A' : '#F8FAFC',
                  color: selectedType === type.value ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 100ms ease',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Difficulty Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: 600 }}>Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.8125rem',
                color: '#334155',
                backgroundColor: '#FFFFFF',
              }}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <p style={{ fontWeight: 700, color: '#1E293B', fontSize: '1.125rem' }}>No learning resources found</p>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            No workshop materials match your current filter combination.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedType('ALL');
              setSelectedDifficulty('ALL');
            }}
            style={{ marginTop: '16px' }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              elevated
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid #E2E8F0',
              }}
            >
              <div>
                {/* Header Pills */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      textTransform: 'uppercase',
                    }}
                  >
                    {res.resource_type.replace('_', ' ')}
                  </span>
                  <StatusPill
                    label={res.difficulty_level}
                    variant={
                      res.difficulty_level === 'BEGINNER'
                        ? 'success'
                        : res.difficulty_level === 'INTERMEDIATE'
                        ? 'warning'
                        : 'error'
                    }
                  />
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#014B7A', lineHeight: 1.3, marginBottom: '8px' }}>
                  <Link href={`/learning/${res.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {res.title}
                  </Link>
                </h3>

                {res.description && (
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                    {res.description}
                  </p>
                )}

                {res.linked_event_title && (
                  <div style={{ marginBottom: '16px' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#F0FDF4',
                        color: '#15803D',
                        border: '1px solid #BBF7D0',
                      }}
                    >
                      Presented at {res.linked_event_title}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {isValidUrl(res.url) ? (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" size="sm">
                      {getLaunchLabel(res.resource_type)}
                    </Button>
                  </a>
                ) : (
                  <span />
                )}

                <Link href={`/learning/${res.slug}`} style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="sm" style={{ color: '#014B7A', fontWeight: 600 }}>
                    Details →
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
