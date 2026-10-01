'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Project } from '@connect/types';
import { Card, StatusPill, Button, EmptyState } from '@connect/ui';

interface ProjectsClientProps {
  initialProjects: Project[];
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_DEVELOPMENT'>('ALL');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      // Must be public and non-draft
      if (p.visibility !== 'PUBLIC' || p.status === 'IDEA' || p.status === 'ARCHIVED') {
        return false;
      }

      if (statusFilter !== 'ALL' && p.status !== statusFilter) {
        return false;
      }

      if (featuredOnly && !p.is_featured) {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSummary = p.summary.toLowerCase().includes(q);
        const matchesTech = p.technology_stack?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesTech) {
          return false;
        }
      }

      return true;
    });
  }, [initialProjects, search, statusFilter, featuredOnly]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Editorial Header Banner */}
      <section
        style={{
          backgroundColor: '#111820',
          borderRadius: '16px',
          padding: '40px 32px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          border: '1px solid #1D2630',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#A3E635',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              INNOVATION & SHOWCASE DIRECTORY
            </span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0 }}>
            Student & Applied AI Projects
          </h1>
          <p style={{ fontSize: '1rem', color: '#94A3B8', marginTop: '12px', lineHeight: 1.6 }}>
            Explore verified student engineering deliverables, neural network prototypes, robotics experiments, and
            open-source tools developed by the AI &amp; Machine Learning Club at Oriental College of Technology, Bhopal.
          </p>
        </div>

        <div>
          <Link href="/projects/submit" style={{ textDecoration: 'none' }}>
            <Button
              variant="secondary"
              style={{
                backgroundColor: '#00763C',
                color: '#FFFFFF',
                fontWeight: 600,
                padding: '12px 20px',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(0, 118, 60, 0.3)',
              }}
            >
              + Propose a Project
            </Button>
          </Link>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', minWidth: '240px' }}>
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
            placeholder="Search by title, description, or technology (e.g. PyTorch, YOLO)..."
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
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Badges & Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
            {(['ALL', 'COMPLETED', 'IN_DEVELOPMENT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: statusFilter === tab ? '#014B7A' : '#F8FAFC',
                  color: statusFilter === tab ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 100ms ease',
                }}
              >
                {tab === 'ALL' ? 'All Status' : tab === 'COMPLETED' ? 'Completed' : 'In Dev'}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              style={{ accentColor: '#014B7A' }}
            />
            Featured Only
          </label>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match your filter"
          description="Try clearing your search query or switching your status filter to explore more student deliverables."
          actionText="Reset All Filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('ALL');
            setFeaturedOnly(false);
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              elevated
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                border: project.is_featured ? '1px solid #93C5FD' : '1px solid #E2E8F0',
                position: 'relative',
              }}
            >
              <div>
                {/* Header Pills */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusPill
                      label={project.status === 'COMPLETED' ? 'Completed' : 'In Development'}
                      variant={project.status === 'COMPLETED' ? 'success' : 'warning'}
                    />
                    {project.is_featured && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid #FDE68A',
                        }}
                      >
                        ★ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', lineHeight: 1.3, marginBottom: '8px' }}>
                  <Link href={`/projects/${project.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {project.title}
                  </Link>
                </h3>

                {/* Summary */}
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
                  {project.summary}
                </p>

                {/* Tech Stack */}
                {project.technology_stack && project.technology_stack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {project.technology_stack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technology_stack.length > 4 && (
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8', alignSelf: 'center' }}>
                        +{project.technology_stack.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Meta */}
              <div
                style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '16px',
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  {project.members && project.members.length > 0 ? (
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Lead: <strong style={{ color: '#334155' }}>{project.members[0].student_full_name || 'Student Lead'}</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>AIML Club OCT</span>
                  )}
                </div>

                <Link href={`/projects/${project.slug}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm" style={{ padding: '4px 12px', fontSize: '0.8125rem' }}>
                    View Details →
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
