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

const SEED_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: '00000000-0000-0000-0000-000000000941',
    title: 'Introduction to PyTorch & Neural Networks Workshop Notebook',
    slug: 'pytorch-neural-networks-notebook',
    resource_type: 'NOTEBOOK',
    difficulty_level: 'BEGINNER',
    description: 'Interactive Google Colab notebook accompanying Aptify 2.0 PyTorch zero-to-hero hands-on lab.',
    url: 'https://colab.research.google.com/github/aimlcluboct/workshops/blob/main/pytorch_intro.ipynb',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    visibility: 'PUBLIC',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    published_at: '2026-03-01T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000942',
    title: 'Computer Vision & Object Detection with YOLOv8',
    slug: 'yolov8-object-detection-slides',
    resource_type: 'SLIDES',
    difficulty_level: 'INTERMEDIATE',
    description: 'Comprehensive slide deck explaining architecture, anchor boxes, and loss functions in modern single-shot detectors.',
    url: 'https://docs.google.com/presentation/d/1yolov8_oct_presentation/edit',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    visibility: 'PUBLIC',
    created_at: '2026-03-05T11:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
    published_at: '2026-03-05T12:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000943',
    title: 'Advanced LLM Fine-Tuning & Quantization Guide',
    slug: 'advanced-llm-fine-tuning-guide',
    resource_type: 'DOCUMENTATION',
    difficulty_level: 'ADVANCED',
    description: 'In-depth guide covering QLoRA, parameter-efficient fine-tuning (PEFT), and 4-bit quantization on campus compute nodes.',
    url: 'https://aimlcluboct.in/docs/llm-tuning',
    visibility: 'PUBLIC',
    created_at: '2026-04-10T12:00:00Z',
    updated_at: '2026-04-10T14:00:00Z',
    published_at: '2026-04-10T14:00:00Z',
  },
];

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
  } catch {
    // Offline fallback for static build
  }
  return SEED_LEARNING_RESOURCES;
}

export default async function LearningPage() {
  const initialResources = await getLearningResources();
  return <LearningClient initialResources={initialResources} />;
}
