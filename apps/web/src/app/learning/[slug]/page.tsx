import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import type { LearningResource, LearningResourceType } from '@connect/types';
import { Card, Button, StatusPill } from '@connect/ui';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SEED_DETAIL_LEARNING: Record<string, LearningResource> = {
  'pytorch-neural-networks-notebook': {
    id: '00000000-0000-0000-0000-000000000941',
    title: 'Introduction to PyTorch & Neural Networks Workshop Notebook',
    slug: 'pytorch-neural-networks-notebook',
    resource_type: 'NOTEBOOK',
    difficulty_level: 'BEGINNER',
    description: `Interactive Google Colab notebook accompanying Aptify 2.0 PyTorch zero-to-hero hands-on lab.

### Curriculum Overview
1. Tensor operations and GPU acceleration primitives in PyTorch.
2. Building feed-forward neural networks using torch.nn.Module.
3. Defining loss functions and optimizers (SGD vs AdamW).
4. Training loop execution with loss evaluation and accuracy metrics on MNIST / Fashion-MNIST.`,
    url: 'https://colab.research.google.com/github/aimlcluboct/workshops/blob/main/pytorch_intro.ipynb',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    visibility: 'PUBLIC',
    created_at: '2026-03-01T09:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    published_at: '2026-03-01T10:00:00Z',
  },
  'yolov8-object-detection-slides': {
    id: '00000000-0000-0000-0000-000000000942',
    title: 'Computer Vision & Object Detection with YOLOv8',
    slug: 'yolov8-object-detection-slides',
    resource_type: 'SLIDES',
    difficulty_level: 'INTERMEDIATE',
    description: `Comprehensive slide deck explaining architecture, anchor boxes, and loss functions in modern single-shot detectors.

Presented during the Computer Vision workshop track at Oriental College of Technology. Covers custom dataset annotation with Roboflow and transfer learning using Ultralytics.`,
    url: 'https://docs.google.com/presentation/d/1yolov8_oct_presentation/edit',
    linked_event_id: '00000000-0000-0000-0000-000000000101',
    linked_event_title: 'Aptify 2.0: AI Symposium',
    visibility: 'PUBLIC',
    created_at: '2026-03-05T11:00:00Z',
    updated_at: '2026-03-05T12:00:00Z',
    published_at: '2026-03-05T12:00:00Z',
  },
  'advanced-llm-fine-tuning-guide': {
    id: '00000000-0000-0000-0000-000000000943',
    title: 'Advanced LLM Fine-Tuning & Quantization Guide',
    slug: 'advanced-llm-fine-tuning-guide',
    resource_type: 'DOCUMENTATION',
    difficulty_level: 'ADVANCED',
    description: `In-depth guide covering QLoRA, parameter-efficient fine-tuning (PEFT), and 4-bit quantization on campus compute nodes.

Provides production deployment tips, memory profiling with PyTorch CUDA hooks, and model export to GGUF format for local edge inference.`,
    url: 'https://aimlcluboct.in/docs/llm-tuning',
    visibility: 'PUBLIC',
    created_at: '2026-04-10T12:00:00Z',
    updated_at: '2026-04-10T14:00:00Z',
    published_at: '2026-04-10T14:00:00Z',
  },
};

async function fetchLearningResource(slug: string): Promise<LearningResource | null> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/learning/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const resource: LearningResource = body.data;
      if (resource.visibility !== 'PUBLIC') {
        return null;
      }
      return resource;
    }
  } catch {
    // Offline fallback for known seed slug
    if (SEED_DETAIL_LEARNING[slug]) {
      return SEED_DETAIL_LEARNING[slug];
    }
  }
  return SEED_DETAIL_LEARNING[slug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await fetchLearningResource(slug);
  if (!resource) {
    return { title: 'Resource Not Found | AIML CLUB OCT' };
  }
  return {
    title: `${resource.title} — AIML CLUB OCT Learning`,
    description: resource.description,
    openGraph: {
      title: `${resource.title} — AIML CLUB OCT Learning`,
      description: resource.description,
    },
  };
}

export default async function LearningDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await fetchLearningResource(slug);

  if (!resource) {
    notFound();
  }

  const isValidUrl = (url?: string) => !!url && /^https?:\/\//i.test(url);

  const getLaunchLabel = (type: LearningResourceType) => {
    switch (type) {
      case 'NOTEBOOK':
        return '🚀 Launch in Google Colab';
      case 'SLIDES':
        return '📑 Open Full Presentation Slides';
      case 'DOCUMENTATION':
        return '📖 Read Technical Documentation';
      case 'DATASET':
        return '📊 Download Dataset File';
      case 'RECORDING':
        return '▶ Watch Video Recording';
      default:
        return '↗ Open Educational Resource';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '850px', margin: '0 auto' }}>
      {/* Back Link */}
      <div>
        <Link
          href="/learning"
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
          ← Back to All Learning Resources
        </Link>
      </div>

      {/* Main Header Lockup */}
      <section
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 10px',
              borderRadius: '9999px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              border: '1px solid #BFDBFE',
              textTransform: 'uppercase',
            }}
          >
            {resource.resource_type.replace('_', ' ')}
          </span>
          <StatusPill
            label={resource.difficulty_level}
            variant={
              resource.difficulty_level === 'BEGINNER'
                ? 'success'
                : resource.difficulty_level === 'INTERMEDIATE'
                ? 'warning'
                : 'error'
            }
          />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#014B7A', lineHeight: 1.3 }}>
          {resource.title}
        </h1>

        {/* Action Button */}
        {isValidUrl(resource.url) && (
          <div style={{ marginTop: '24px' }}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg" style={{ display: 'inline-flex', gap: '8px' }}>
                {getLaunchLabel(resource.resource_type)}
              </Button>
            </a>
          </div>
        )}
      </section>

      {/* Description Body */}
      {resource.description && (
        <Card elevated style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#014B7A', marginBottom: '16px' }}>
            Overview &amp; Curriculum Content
          </h2>
          <div style={{ fontSize: '1rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {resource.description}
          </div>
        </Card>
      )}

      {/* Linked Event Card */}
      {resource.linked_event_title && (
        <Card elevated style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', padding: '24px' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
            Associated Event
          </div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#14532D', marginTop: '6px' }}>
            {resource.linked_event_title}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#15803D', marginTop: '4px' }}>
            This resource was developed as hands-on workshop material for this event.
          </p>
        </Card>
      )}
    </div>
  );
}
