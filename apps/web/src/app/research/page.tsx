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

const SEED_RESEARCH_ITEMS: ResearchItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000921',
    title: 'Comparative Analysis of Lightweight Transformer Architectures for Edge Devices',
    slug: 'edge-transformer-architectures-oct',
    abstract: 'We evaluate quantization, pruning, and low-rank approximation methods for MobileBERT and TinyLlama deployed on Jetson Orin edge nodes in campus edge AI setups.',
    authors: [
      {
        name: 'Aman Sharma',
        affiliation: 'Oriental College of Technology, Bhopal',
        role: 'Lead Researcher',
      },
      {
        name: 'Club Research Group',
        affiliation: 'AIML Club OCT',
        role: 'Collaborators',
      },
    ],
    category: 'AI_ML',
    methodology: 'Benchmarking inference latency, memory consumption, and perplexity across quantized models running TensorRT and ONNX Runtime.',
    publication_url: 'https://arxiv.org/abs/2401.00001',
    repository_url: 'https://github.com/aimlcluboct/edge-transformers',
    dataset_url: 'https://huggingface.co/datasets/aimlcluboct/campus-edge-benchmarks',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_project_id: '00000000-0000-0000-0000-000000000901',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-03-15T10:00:00Z',
    published_at: '2026-03-15T10:00:00Z',
  },
];

async function getPublishedResearch(): Promise<ResearchItem[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/research?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: ResearchItem[] = body.data || [];
      // Strict security filter: Never show draft or non-public research publicly
      return list.filter((r) => r.visibility === 'PUBLIC' && r.status === 'PUBLISHED');
    }
  } catch {
    // Offline fallback during build
  }
  return SEED_RESEARCH_ITEMS;
}

export default async function ResearchPage() {
  const initialResearch = await getPublishedResearch();
  return <ResearchClient initialResearch={initialResearch} />;
}
