import React from 'react';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { LearningResource } from '@connect/types';
import LearningClient from './LearningClient';

export const metadata: Metadata = {
  title: 'Open Learning Resources & Labs — AIML CLUB OCT',
  description:
    'Free, curated machine learning notebooks, Google Colab tutorials, workshop slide decks, and training datasets from Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Open Learning Resources & Labs — AIML CLUB OCT',
    description: 'Explore interactive Colab notebooks, workshop slides, and tutorials curated by AIML Club OCT.',
  },
};

async function getLearningResources(): Promise<LearningResource[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/learning?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: LearningResource[] = body.data || [];
      return list.filter((r) => r.visibility === 'PUBLIC');
    }
  } catch (err) {
    console.error('Failed to fetch learning resources from API:', err);
  }
  return [];
}

export default async function LearningPage() {
  const initialResources = await getLearningResources();
  return <LearningClient initialResources={initialResources} />;
}
