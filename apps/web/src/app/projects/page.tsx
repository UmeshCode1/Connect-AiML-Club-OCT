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

async function getPublicProjects(): Promise<Project[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/projects?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: Project[] = body.data || [];
      return list.filter((p) => p.visibility === 'PUBLIC' && p.status !== 'IDEA' && p.status !== 'ARCHIVED');
    }
  } catch (err) {
    console.error('Failed to fetch projects from API:', err);
  }
  return [];
}

export default async function ProjectsPage() {
  const initialProjects = await getPublicProjects();
  return <ProjectsClient initialProjects={initialProjects} />;
}

