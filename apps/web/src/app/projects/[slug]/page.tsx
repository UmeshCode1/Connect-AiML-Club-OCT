import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { Project } from '@connect/types';
import { Card, StatusPill, Button } from '@connect/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SEED_DETAIL_PROJECTS: Record<string, Project> = {
  'oct-vision-ai-campus': {
    id: '00000000-0000-0000-0000-000000000901',
    title: 'OCT Vision AI: Smart Campus Surveillance',
    slug: 'oct-vision-ai-campus',
    summary: 'Edge-computed real-time student safety and campus monitoring using YOLOv8 and Jetson nano nodes.',
    description: `Comprehensive vision AI platform deployed at Oriental College of Technology, detecting safety anomalies and parking congestion using local neural edge inferencing.

### Problem Statement
Campus environments require proactive safety monitoring and crowd management without streaming sensitive high-resolution video feeds off-campus to commercial cloud providers.

### Proposed Architecture & Solution
We designed a decentralized neural edge compute topology utilizing NVIDIA Jetson Nano nodes running TensorRT-optimized YOLOv8 models directly on local RTSP streams. Only non-personally identifiable bounding-box telemetry is forwarded to the central campus dashboard.`,
    status: 'COMPLETED',
    technology_stack: ['Python', 'PyTorch', 'YOLOv8', 'OpenCV', 'FastAPI', 'TensorRT'],
    repository_url: 'https://github.com/aimlcluboct/oct-vision-ai',
    demo_url: 'https://vision.aimlcluboct.in',
    documentation_url: 'https://docs.aimlcluboct.in/projects/vision-ai',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    linked_event_slug: 'aptify-2026',
    visibility: 'PUBLIC',
    is_featured: true,
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-03-10T10:00:00Z',
    published_at: '2026-03-10T10:00:00Z',
    members: [
      {
        id: 'm1',
        project_id: '00000000-0000-0000-0000-000000000901',
        student_id: 's1',
        role: 'LEAD',
        display_order: 0,
        created_at: '2026-02-01T09:00:00Z',
        student_full_name: 'Aman Sharma',
      },
      {
        id: 'm2',
        project_id: '00000000-0000-0000-0000-000000000901',
        student_id: 's3',
        role: 'CONTRIBUTOR',
        display_order: 1,
        created_at: '2026-02-05T10:00:00Z',
        student_full_name: 'Priya Patel',
      },
    ],
  },
  'aptify-recommendation-engine': {
    id: '00000000-0000-0000-0000-000000000902',
    title: 'Aptify Recommendation Engine',
    slug: 'aptify-recommendation-engine',
    summary: 'Graph-based hybrid workshop and session recommendation engine for Aptify symposium participants.',
    description: `Collaborative filtering and LLM semantic embeddings engine personalizing workshop schedules according to student skill level.

### Problem Statement
Students attending large multi-track symposiums often experience schedule paralysis when attempting to choose between parallel AI, data science, and web engineering tracks.

### Solution
A vector-similarity recommendation service matching participant interests, declared skill proficiencies, and workshop difficulty tiers using pgvector embeddings.`,
    status: 'IN_DEVELOPMENT',
    technology_stack: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'Docker'],
    repository_url: 'https://github.com/aimlcluboct/aptify-recs',
    demo_url: undefined,
    documentation_url: undefined,
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    linked_event_slug: 'aptify-2026',
    visibility: 'PUBLIC',
    is_featured: false,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-15T12:00:00Z',
    published_at: '2026-09-15T12:00:00Z',
    members: [
      {
        id: 'm3',
        project_id: '00000000-0000-0000-0000-000000000902',
        student_id: 's2',
        role: 'LEAD',
        display_order: 0,
        created_at: '2026-09-01T10:00:00Z',
        student_full_name: 'Student Member',
      },
    ],
  },
};

async function fetchProject(slug: string): Promise<Project | null> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/projects/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      const project: Project = data.data;
      // Guardrail: Never expose draft or non-public projects to public view
      if (project.visibility !== 'PUBLIC' || project.status === 'IDEA' || project.status === 'ARCHIVED') {
        return null;
      }
      return project;
    }
  } catch {
    // Offline fallback for known seed projects during static build
    if (SEED_DETAIL_PROJECTS[slug]) {
      return SEED_DETAIL_PROJECTS[slug];
    }
  }
  return SEED_DETAIL_PROJECTS[slug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) {
    return { title: 'Project Not Found | AIML CLUB OCT' };
  }
  return {
    title: `${project.title} — AIML CLUB OCT`,
    description: project.summary,
    openGraph: {
      title: `${project.title} — AIML CLUB OCT`,
      description: project.summary,
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await fetchProject(slug);

  if (!project) {
    notFound();
  }

  // URL security validator: strictly HTTP(S) only
  const isValidUrl = (url?: string) => {
    return !!url && /^https?:\/\//i.test(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/projects"
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
          ← Back to All Projects
        </Link>
      </div>

      {/* Hero Header Section */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <StatusPill
                label={project.status === 'COMPLETED' ? 'Completed' : 'In Development'}
                variant={project.status === 'COMPLETED' ? 'success' : 'warning'}
              />
              {project.is_featured && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
                  }}
                >
                  ★ Featured Innovation
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#014B7A', lineHeight: 1.2 }}>
              {project.title}
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#475569', marginTop: '12px', lineHeight: 1.6, maxWidth: '800px' }}>
              {project.summary}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          {isValidUrl(project.repository_url) && (
            <a
              href={project.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="primary" style={{ display: 'inline-flex', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                View Repository
              </Button>
            </a>
          )}

          {isValidUrl(project.demo_url) && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ display: 'inline-flex', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Live Demo
              </Button>
            </a>
          )}

          {isValidUrl(project.documentation_url) && (
            <a
              href={project.documentation_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline" style={{ display: 'inline-flex', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Technical Docs
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Grid: Details & Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: '28px' }}>
        {/* Main Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Description & Technical Breakdown */}
          <Card elevated>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', marginBottom: '16px' }}>
              Technical Overview &amp; Implementation
            </h2>
            <div
              style={{
                fontSize: '0.9375rem',
                color: '#334155',
                lineHeight: 1.7,
                whiteSpace: 'pre-line',
              }}
            >
              {project.description}
            </div>
          </Card>

          {/* Technology Stack Detailed Section */}
          <Card elevated>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#014B7A', marginBottom: '12px' }}>
              Core Technology Stack
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.technology_stack?.map((tech) => (
                <span
                  key={tech}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar: Contributors & Linked Event */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contributor Roster (Privacy Protected: Strictly Student Name & Role) */}
          <Card elevated>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#014B7A', marginBottom: '16px' }}>
              Verified Contributors ({project.members?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.members && project.members.length > 0 ? (
                project.members.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#E0F2FE',
                          color: '#0369A1',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {(m.student_full_name || 'U')[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                        {m.student_full_name || 'Student Contributor'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: m.role === 'LEAD' ? '#E0F2FE' : '#F1F5F9',
                        color: m.role === 'LEAD' ? '#0369A1' : '#475569',
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#64748B' }}>AIML Club OCT Engineering Team</p>
              )}
            </div>
          </Card>

          {/* Linked Event Card */}
          {project.linked_event_title && (
            <Card elevated style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>
                Originating Symposium / Workshop
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0C4A6E', marginTop: '6px' }}>
                {project.linked_event_title}
              </h4>
              <div style={{ marginTop: '12px' }}>
                <Link
                  href={`/events/${project.linked_event_slug || project.linked_event_id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="outline" size="sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#0284C7' }}>
                    View Event Details →
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Institutional Badge */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
              Official deliverable under <strong>AIML CLUB OCT</strong>.
              <br />
              Oriental College of Technology, Bhopal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
