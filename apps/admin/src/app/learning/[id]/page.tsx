'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LearningResource, LearningResourceType, LearningDifficultyLevel, LearningResourceVisibility } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

const TYPE_LABELS: Record<LearningResourceType, string> = {
  NOTEBOOK: 'Colab Notebook',
  TUTORIAL: 'Written Tutorial',
  WORKSHOP_MATERIAL: 'Workshop Material',
  RECORDING: 'Session Recording',
  DATASET: 'Training Dataset',
  SLIDES: 'Presentation Slides',
  DOCUMENTATION: 'API / Tech Documentation',
};

const DIFFICULTY_BADGES: Record<LearningDifficultyLevel, { bg: string; text: string; border: string }> = {
  BEGINNER: { bg: '#064E3B22', text: '#6EE7B7', border: '#10B981' },
  INTERMEDIATE: { bg: '#1E3A8A22', text: '#93C5FD', border: '#3B82F6' },
  ADVANCED: { bg: '#581C8722', text: '#D8B4FE', border: '#A855F7' },
};

const SAMPLE_LEARNING: LearningResource = {
  id: '00000000-0000-0000-0000-000000000851',
  title: 'Hands-on PyTorch: Building Deep Neural Networks from Scratch',
  slug: 'pytorch-neural-networks-notebook',
  resource_type: 'NOTEBOOK',
  difficulty_level: 'BEGINNER',
  description: 'Interactive Google Colab notebook accompanying the Aptify deep learning session with GPU acceleration.',
  url: 'https://colab.research.google.com/github/aimlcluboct/pytorch-basics.ipynb',
  linked_event_id: '00000000-0000-0000-0000-000000000101',
  linked_event_title: 'Aptify 2.0: AI Symposium',
  visibility: 'PUBLIC',
  published_at: '2026-03-11T12:00:00Z',
  created_at: '2026-02-20T10:00:00Z',
  updated_at: '2026-03-11T12:00:00Z',
};

export default function LearningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const resourceId = resolvedParams.id;
  const router = useRouter();

  const [resource, setResource] = useState<LearningResource>(SAMPLE_LEARNING);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<LearningResourceType>('NOTEBOOK');
  const [difficulty, setDifficulty] = useState<LearningDifficultyLevel>('BEGINNER');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [visibility, setVisibility] = useState<LearningResourceVisibility>('PUBLIC');
  const [linkedEventId, setLinkedEventId] = useState('');

  const fetchResourceDetails = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/learning/${resourceId}`, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        const body = await res.json();
        const data: LearningResource = body.data;
        setResource(data);
        populateForm(data);
      } else {
        populateForm(SAMPLE_LEARNING);
      }
    } catch {
      populateForm(SAMPLE_LEARNING);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: LearningResource) => {
    setTitle(data.title || '');
    setSlug(data.slug || '');
    setType(data.resource_type || 'NOTEBOOK');
    setDifficulty(data.difficulty_level || 'BEGINNER');
    setDescription(data.description || '');
    setUrl(data.url || '');
    setVisibility(data.visibility || 'PUBLIC');
    setLinkedEventId(data.linked_event_id || '');
  };

  useEffect(() => {
    fetchResourceDetails();
  }, [resourceId]);

  const validateUrl = (testUrl: string): boolean => {
    return /^https?:\/\/.+/i.test(testUrl.trim());
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setActionMessage({ type: 'error', text: 'Title and Resource URL are required.' });
      return;
    }

    if (!validateUrl(url)) {
      setActionMessage({ type: 'error', text: 'Resource URL must use http:// or https:// schemes.' });
      return;
    }

    setIsSaving(true);
    setActionMessage(null);

    const payload: Record<string, any> = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      resource_type: type,
      difficulty_level: difficulty,
      description: description.trim() || undefined,
      url: url.trim(),
      visibility,
      linked_event_id: linkedEventId.trim() || undefined,
    };

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/learning/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = await res.json();
        setResource(body.data);
        setActionMessage({ type: 'success', text: 'Learning resource updated successfully.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to update resource.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/learning/${resourceId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        router.push('/learning');
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to delete resource.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const diffBadge = DIFFICULTY_BADGES[resource.difficulty_level] || DIFFICULTY_BADGES.BEGINNER;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Back Link */}
      <div>
        <Link href="/learning" style={{ color: '#38BDF8', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Back to Learning Catalog
        </Link>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '8px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>{resource.title}</h1>
              <span
                style={{
                  backgroundColor: diffBadge.bg,
                  color: diffBadge.text,
                  border: `1px solid ${diffBadge.border}`,
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {resource.difficulty_level}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              Type: {TYPE_LABELS[resource.resource_type]} • Slug: /{resource.slug}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                textDecoration: 'none',
              }}
            >
              Open External URL ↗
            </a>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              style={{
                backgroundColor: '#DC262622',
                color: '#EF4444',
                border: '1px solid #DC262655',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Delete Resource
            </button>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      {actionMessage && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            backgroundColor: actionMessage.type === 'success' ? '#064E3B44' : '#7F1D1D44',
            color: actionMessage.type === 'success' ? '#6EE7B7' : '#FCA5A5',
            border: `1px solid ${actionMessage.type === 'success' ? '#059669' : '#DC2626'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      )}

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Form */}
        <div
          style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
            Resource Configuration
          </h2>
          <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Resource Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LearningResourceType)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #1E293B',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                >
                  {Object.entries(TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as LearningDifficultyLevel)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #1E293B',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Resource URL * (https://)
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as LearningResourceVisibility)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #1E293B',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="AUTHENTICATED">Authenticated</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Linked Event ID
                </label>
                <input
                  type="text"
                  placeholder="UUID of associated event"
                  value={linkedEventId}
                  onChange={(e) => setLinkedEventId(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #1E293B',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: '#014B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                }}
              >
                {isSaving ? 'Saving Changes...' : 'Save Resource Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Metadata Card */}
        <div>
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
              Catalog & Event Context
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Associated Event:</span>
                <span style={{ color: '#38BDF8' }}>{resource.linked_event_title || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Visibility:</span>
                <span style={{ color: '#F8FAFC' }}>{resource.visibility}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Creation Date:</span>
                <span style={{ color: '#F8FAFC' }}>{new Date(resource.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1100,
          }}
        >
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '460px',
              width: '100%',
              color: '#F8FAFC',
            }}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '10px' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to delete &quot;{resource.title}&quot;? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Delete Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
