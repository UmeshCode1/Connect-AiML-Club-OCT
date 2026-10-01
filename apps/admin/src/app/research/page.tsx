'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ResearchItem, ResearchCategory, ResearchStatus, ResearchVisibility, ResearchAuthor } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

const CATEGORY_LABELS: Record<ResearchCategory, string> = {
  AI_ML: 'AI / Machine Learning',
  COMPUTER_VISION: 'Computer Vision',
  NLP: 'Natural Language Processing',
  REINFORCEMENT_LEARNING: 'Reinforcement Learning',
  GENERATIVE_AI: 'Generative AI',
  ROBOTICS: 'Robotics & Control',
  DATA_SCIENCE: 'Data Science & Analytics',
};

const STATUS_BADGES: Record<ResearchStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: '#78350F22', text: '#FDE68A', border: '#D97706' },
  PUBLISHED: { bg: '#064E3B22', text: '#6EE7B7', border: '#10B981' },
  ARCHIVED: { bg: '#18181B55', text: '#94A3B8', border: '#475569' },
};
// Real API records only


export default function ResearchAdminPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Creation modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newMethodology, setNewMethodology] = useState('');
  const [newCategory, setNewCategory] = useState<ResearchCategory>('AI_ML');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorAffiliation, setNewAuthorAffiliation] = useState('');
  const [newPubUrl, setNewPubUrl] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newDatasetUrl, setNewDatasetUrl] = useState('');
  const [newVisibility, setNewVisibility] = useState<ResearchVisibility>('PUBLIC');
  const [newStatus, setNewStatus] = useState<ResearchStatus>('DRAFT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workflow confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    action: 'publish' | 'archive';
    title: string;
  }>({ isOpen: false, itemId: '', action: 'publish', title: '' });

  const fetchResearchItems = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let url = `${apiUrl}/v1/research?page_size=50`;
      if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (visibilityFilter !== 'ALL') url += `&visibility=${visibilityFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });
      if (res.ok) {
        const body = await res.json();
        setItems(body.data || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to fetch research items in admin:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, visibilityFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResearchItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchResearchItems]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+/i.test(url.trim());
  };

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAbstract.trim()) {
      setActionMessage({ type: 'error', text: 'Title and Abstract are required.' });
      return;
    }

    if (!validateUrl(newPubUrl) || !validateUrl(newRepoUrl) || !validateUrl(newDatasetUrl)) {
      setActionMessage({ type: 'error', text: 'External URLs must use safe http:// or https:// schemes.' });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    const authorsList: ResearchAuthor[] = [];
    if (newAuthorName.trim()) {
      authorsList.push({
        name: newAuthorName.trim(),
        affiliation: newAuthorAffiliation.trim() || undefined,
        role: 'Author',
      });
    }

    const payload: Record<string, any> = {
      title: newTitle.trim(),
      abstract: newAbstract.trim(),
      category: newCategory,
      visibility: newVisibility,
      status: newStatus,
      authors: authorsList,
    };

    if (newSlug.trim()) payload.slug = newSlug.trim();
    if (newMethodology.trim()) payload.methodology = newMethodology.trim();
    if (newPubUrl.trim()) payload.publication_url = newPubUrl.trim();
    if (newRepoUrl.trim()) payload.repository_url = newRepoUrl.trim();
    if (newDatasetUrl.trim()) payload.dataset_url = newDatasetUrl.trim();

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Research item "${newTitle}" registered successfully.` });
        setIsCreateModalOpen(false);
        // Reset
        setNewTitle('');
        setNewSlug('');
        setNewAbstract('');
        setNewMethodology('');
        setNewAuthorName('');
        setNewAuthorAffiliation('');
        setNewPubUrl('');
        setNewRepoUrl('');
        setNewDatasetUrl('');
        setNewCategory('AI_ML');
        setNewVisibility('PUBLIC');
        setNewStatus('DRAFT');
        fetchResearchItems();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to create research paper.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeResearchAction = async (itemId: string, action: 'publish' | 'archive') => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/research/${itemId}/${action}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Research item successfully ${action}ed.` });
        fetchResearchItems();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || `Failed to ${action} research item.` });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setConfirmDialog({ isOpen: false, itemId: '', action: 'publish', title: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & New Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Academic Research & Papers</h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
            Review institutional pre-prints, datasets, and methodologies produced by club students and faculty.
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
          <span>+</span> Add Research Item
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

      {/* Search and Filters Bar */}
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
            placeholder="Search papers by title, abstract, or authors..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
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

        {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || visibilityFilter !== 'ALL') && (
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

      {/* Research Items Table */}
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
              <th style={{ padding: '12px 16px' }}>Paper Title</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Visibility</th>
              <th style={{ padding: '12px 16px' }}>Authors</th>
              <th style={{ padding: '12px 16px' }}>Published</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  Loading research items...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  No research items found matching criteria.
                </td>
              </tr>
            ) : (
              items.map((r) => {
                const sColor = STATUS_BADGES[r.status] || STATUS_BADGES.DRAFT;

                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #1E293B',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                      <Link
                        href={`/research/${r.id}`}
                        style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {r.title}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        /{r.slug}
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
                        {CATEGORY_LABELS[r.category] || r.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: sColor.bg,
                          color: sColor.text,
                          border: `1px solid ${sColor.border}`,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#CBD5E1', fontSize: '0.8125rem' }}>
                      {r.visibility}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8125rem' }}>
                      {r.authors?.map((a) => a.name).join(', ') || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '0.8rem' }}>
                      {r.published_at ? new Date(r.published_at).toLocaleDateString() : 'Draft'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          href={`/research/${r.id}`}
                          style={{
                            color: '#38BDF8',
                            fontSize: '0.8125rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#014B7A22',
                            border: '1px solid #014B7A55',
                          }}
                        >
                          Review & Edit
                        </Link>
                        {r.status !== 'PUBLISHED' && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                itemId: r.id,
                                action: 'publish',
                                title: r.title,
                              })
                            }
                            style={{
                              color: '#10B981',
                              fontSize: '0.8125rem',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#10B98111',
                              border: '1px solid #10B98133',
                              cursor: 'pointer',
                            }}
                          >
                            Publish
                          </button>
                        )}
                        {r.status !== 'ARCHIVED' && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                itemId: r.id,
                                action: 'archive',
                                title: r.title,
                              })
                            }
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
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Research Modal */}
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
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: '#F8FAFC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Register Research Paper / Pre-print</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateResearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Paper / Pre-print Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Edge-Optimized Neural Networks for Campus Surveillance"
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
                  Slug (URL Identifier)
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Academic Abstract *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Problem formulation, experiment setup, and main findings..."
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
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
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ResearchCategory)}
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
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                    Visibility
                  </label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as ResearchVisibility)}
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                    Primary Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aman Sharma"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
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
                    Author Affiliation
                  </label>
                  <input
                    type="text"
                    placeholder="Department of AIML, OCT"
                    value={newAuthorAffiliation}
                    onChange={(e) => setNewAuthorAffiliation(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Publication / ArXiv URL (https://)
                </label>
                <input
                  type="url"
                  placeholder="https://arxiv.org/..."
                  value={newPubUrl}
                  onChange={(e) => setNewPubUrl(e.target.value)}
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
                    Code Repository URL (https://)
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newRepoUrl}
                    onChange={(e) => setNewRepoUrl(e.target.value)}
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
                    Dataset URL (https://)
                  </label>
                  <input
                    type="url"
                    placeholder="https://huggingface.co/..."
                    value={newDatasetUrl}
                    onChange={(e) => setNewDatasetUrl(e.target.value)}
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
                  {isSubmitting ? 'Saving...' : 'Register Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
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
              Confirm {confirmDialog.action === 'publish' ? 'Publication' : 'Archival'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to {confirmDialog.action} &quot;{confirmDialog.title}&quot;?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmDialog({ isOpen: false, itemId: '', action: 'publish', title: '' })}
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
                onClick={() => executeResearchAction(confirmDialog.itemId, confirmDialog.action)}
                style={{
                  backgroundColor: confirmDialog.action === 'publish' ? '#00763C' : '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Confirm {confirmDialog.action === 'publish' ? 'Publish' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
