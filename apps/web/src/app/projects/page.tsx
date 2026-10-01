import React from 'react';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { Project } from '@connect/types';
import ProjectsClient from './ProjectsClient';

export const metadata: Metadata = {
  title: 'Projects & Innovation Showcase — AIML CLUB OCT',
  description:
    'Discover student-led applied AI research, intelligent campus systems, computer vision deployments, and software engineering projects from Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Projects & Innovation Showcase — AIML CLUB OCT',
    description: 'Explore applied machine learning, vision AI, and intelligent systems engineered by AIML Club OCT students.',
  },
};

const SEED_PROJECTS: Project[] = [
  {
    id: '00000000-0000-0000-0000-000000000901',
    title: 'OCT Vision AI: Smart Campus Surveillance',
    slug: 'oct-vision-ai-campus',
    summary: 'Edge-computed real-time student safety and campus monitoring using YOLOv8 and Jetson nano nodes.',
    description: 'Comprehensive vision AI platform deployed at Oriental College of Technology, detecting safety anomalies and parking congestion using local neural edge inferencing.',
    status: 'COMPLETED',
    technology_stack: ['Python', 'PyTorch', 'YOLOv8', 'OpenCV', 'FastAPI'],
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
    ],
  },
  {
    id: '00000000-0000-0000-0000-000000000902',
    title: 'Aptify Recommendation Engine',
    slug: 'aptify-recommendation-engine',
    summary: 'Graph-based hybrid workshop and session recommendation engine for Aptify symposium participants.',
    description: 'Collaborative filtering and LLM semantic embeddings engine personalizing workshop schedules according to student skill level.',
    status: 'IN_DEVELOPMENT',
    technology_stack: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector'],
    repository_url: 'https://github.com/aimlcluboct/aptify-recs',
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
        id: 'm2',
        project_id: '00000000-0000-0000-0000-000000000902',
        student_id: 's2',
        role: 'LEAD',
        display_order: 0,
        created_at: '2026-09-01T10:00:00Z',
        student_full_name: 'Student Member',
      },
    ],
  },
];

async function getPublicProjects(): Promise<Project[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/projects?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: Project[] = body.data || [];
      // Filter out any non-public or unapproved projects as strict secondary safety boundary
      return list.filter((p) => p.visibility === 'PUBLIC' && p.status !== 'IDEA' && p.status !== 'ARCHIVED');
    }
  } catch {
    // Graceful fallback during offline build
  }
  return SEED_PROJECTS;
}

export default async function ProjectsPage() {
  const initialProjects = await getPublicProjects();
  return <ProjectsClient initialProjects={initialProjects} />;
}
