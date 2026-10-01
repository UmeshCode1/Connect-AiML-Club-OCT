import React from 'react';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { ResearchItem } from '@connect/types';
import ResearchClient from './ResearchClient';

export const metadata: Metadata = {
  title: 'Academic Research & Pre-prints — AIML CLUB OCT',
  description:
    'Institutional artificial intelligence and machine learning publications, conference pre-prints, benchmark datasets, and technical reports from Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Academic Research & Pre-prints — AIML CLUB OCT',
    description: 'Explore research publications, benchmark datasets, and pre-prints authored by AIML Club OCT.',
  },
};

async function getPublishedResearch(): Promise<ResearchItem[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/research?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: ResearchItem[] = body.data || [];
      return list.filter((r) => r.visibility === 'PUBLIC' && r.status === 'PUBLISHED');
    }
  } catch (err) {
    console.error('Failed to fetch research from API:', err);
  }
  return [];
}

export default async function ResearchPage() {
  const initialResearch = await getPublishedResearch();
  return <ResearchClient initialResearch={initialResearch} />;
}
