'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
// Real API records only


export default function LearningAdminPage() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState<LearningResourceType>('NOTEBOOK');
  const [newDifficulty, setNewDifficulty] = useState<LearningDifficultyLevel>('BEGINNER');
  const [newDescription, setNewDescription] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newVisibility, setNewVisibility] = useState<LearningResourceVisibility>('PUBLIC');
  const [newLinkedEventId, setNewLinkedEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let url = `${apiUrl}/v1/learning?page_size=50`;
      if (typeFilter !== 'ALL') url += `&resource_type=${typeFilter}`;
      if (difficultyFilter !== 'ALL') url += `&difficulty_level=${difficultyFilter}`;
      if (visibilityFilter !== 'ALL') url += `&visibility=${visibilityFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });
      if (res.ok) {
        const body = await res.json();
        setResources(body.data || []);
      } else {
        setResources([]);
      }
    } catch (err) {
      console.error('Failed to fetch learning resources in admin:', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, difficultyFilter, visibilityFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResources();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchResources]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setDifficultyFilter('ALL');
    setVisibilityFilter('ALL');
  };

  const validateUrl = (url: string): boolean => {
    return /^https?:\/\/.+/i.test(url.trim());
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      setActionMessage({ type: 'error', text: 'Title and Resource URL are required.' });
      return;
    }

    if (!validateUrl(newUrl)) {
      setActionMessage({ type: 'error', text: 'Resource URL must strictly use http:// or https:// schemes.' });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    const payload: Record<string, any> = {
      title: newTitle.trim(),
      resource_type: newType,
      difficulty_level: newDifficulty,
      url: newUrl.trim(),
      visibility: newVisibility,
    };

    if (newSlug.trim()) payload.slug = newSlug.trim();
    if (newDescription.trim()) payload.description = newDescription.trim();
    if (newLinkedEventId.trim()) payload.linked_event_id = newLinkedEventId.trim();

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/learning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Resource "${newTitle}" created successfully.` });
        setIsCreateModalOpen(false);
        // Reset
        setNewTitle('');
        setNewSlug('');
        setNewDescription('');
        setNewUrl('');
        setNewType('NOTEBOOK');
        setNewDifficulty('BEGINNER');
        setNewVisibility('PUBLIC');
        setNewLinkedEventId('');
        fetchResources();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to create resource.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/learning/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Learning resource deleted.' });
        fetchResources();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to delete resource.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setDeleteDialog({ isOpen: false, id: '', title: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Learning Resources & Notebooks</h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
            Curate Google Colab notebooks, workshop slides, tutorial walkthroughs, and datasets for students.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            backgroundColor: '#014B7A',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>+</span> Add Resource
        </button>
      </div>

      {/* Message Banner */}
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
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: '#111820',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search resources by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Visibilities</option>
            <option value="PUBLIC">Public</option>
            <option value="AUTHENTICATED">Authenticated</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>

        {(searchQuery || typeFilter !== 'ALL' || difficultyFilter !== 'ALL' || visibilityFilter !== 'ALL') && (
          <button
            onClick={handleClearFilters}
            style={{
              backgroundColor: 'transparent',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#111820',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#64748B', backgroundColor: '#0B0F14' }}>
              <th style={{ padding: '12px 16px' }}>Resource Title</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>Difficulty</th>
              <th style={{ padding: '12px 16px' }}>Visibility</th>
              <th style={{ padding: '12px 16px' }}>External Resource</th>
              <th style={{ padding: '12px 16px' }}>Linked Event</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  Loading educational resources...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  No resources found matching criteria.
                </td>
              </tr>
            ) : (
              resources.map((lr) => {
                const diffBadge = DIFFICULTY_BADGES[lr.difficulty_level] || DIFFICULTY_BADGES.BEGINNER;

                return (
                  <tr
                    key={lr.id}
                    style={{
                      borderBottom: '1px solid #1E293B',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <Link
                        href={`/learning/${lr.id}`}
                        style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {lr.title}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        /{lr.slug}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: '#1E3A8A22',
                          color: '#93C5FD',
                          border: '1px solid #1E3A8A55',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {TYPE_LABELS[lr.resource_type] || lr.resource_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: diffBadge.bg,
                          color: diffBadge.text,
                          border: `1px solid ${diffBadge.border}`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {lr.difficulty_level}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#CBD5E1', fontSize: '0.8125rem' }}>
                      {lr.visibility}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a
                        href={lr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#38BDF8',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Open Asset ↗
                      </a>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                      {lr.linked_event_title || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          href={`/learning/${lr.id}`}
                          style={{
                            color: '#38BDF8',
                            fontSize: '0.8125rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#014B7A22',
                            border: '1px solid #014B7A55',
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, id: lr.id, title: lr.title })}
                          style={{
                            color: '#EF4444',
                            fontSize: '0.8125rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#EF444411',
                            border: '1px solid #EF444433',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
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
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Add Learning Resource</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateResource} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hands-on PyTorch Neural Networks"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                      );
                    }
                  }}
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
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
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
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as LearningResourceType)}
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
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as LearningDifficultyLevel)}
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
                  Resource URL * (Google Colab, GitHub, Drive - must be https://)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://colab.research.google.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
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
                  rows={3}
                  placeholder="Summary of skills learned, prerequisites, and workshop context..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as LearningResourceVisibility)}
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
                    placeholder="Event UUID (optional)"
                    value={newLinkedEventId}
                    onChange={(e) => setNewLinkedEventId(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#014B7A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
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
              Delete Learning Resource
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently delete &quot;{deleteDialog.title}&quot;? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteDialog({ isOpen: false, id: '', title: '' })}
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
                onClick={() => executeDelete(deleteDialog.id)}
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
