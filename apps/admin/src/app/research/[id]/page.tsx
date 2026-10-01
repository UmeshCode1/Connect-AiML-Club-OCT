'use client';

import React, { useState, useEffect, use } from 'react';
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
export default function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const itemId = resolvedParams.id;

  const [item, setItem] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form edit fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [abstract, setAbstract] = useState('');
  const [methodology, setMethodology] = useState('');
  const [category, setCategory] = useState<ResearchCategory>('AI_ML');
  const [publicationUrl, setPublicationUrl] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [datasetUrl, setDatasetUrl] = useState('');
  const [visibility, setVisibility] = useState<ResearchVisibility>('PUBLIC');
  const [linkedEventId, setLinkedEventId] = useState('');
  const [linkedProjectId, setLinkedProjectId] = useState('');

  // Author attribution fields
  const [authors, setAuthors] = useState<ResearchAuthor[]>([]);
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorEnrollment, setNewAuthorEnrollment] = useState('');
  const [newAuthorAffiliation, setNewAuthorAffiliation] = useState('');
  const [newAuthorRole, setNewAuthorRole] = useState('Contributor');

  const fetchResearchDetails = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/research/${itemId}`, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        const body = await res.json();
        const data: ResearchItem = body.data;
        setItem(data);
        populateForm(data);
      } else {
        setActionMessage({ type: 'error', text: 'Research publication not found.' });
      }
    } catch (err) {
      console.error('Failed to fetch research details in admin:', err);
      setActionMessage({ type: 'error', text: 'Failed to connect to API server.' });
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: ResearchItem) => {
    setTitle(data.title || '');
    setSlug(data.slug || '');
    setAbstract(data.abstract || '');
    setMethodology(data.methodology || '');
    setCategory(data.category || 'AI_ML');
    setPublicationUrl(data.publication_url || '');
    setRepositoryUrl(data.repository_url || '');
    setDatasetUrl(data.dataset_url || '');
    setVisibility(data.visibility || 'PUBLIC');
    setLinkedEventId(data.linked_event_id || '');
    setLinkedProjectId(data.linked_project_id || '');
    setAuthors(data.authors || []);
  };

  useEffect(() => {
    fetchResearchDetails();
  }, [itemId]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+/i.test(url.trim());
  };

  const handleSaveResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) {
      setActionMessage({ type: 'error', text: 'Title and Abstract are required.' });
      return;
    }

    if (!validateUrl(publicationUrl) || !validateUrl(repositoryUrl) || !validateUrl(datasetUrl)) {
      setActionMessage({ type: 'error', text: 'All URLs must strictly use safe http:// or https:// schemes.' });
      return;
    }

    setIsSaving(true);
    setActionMessage(null);

    const payload: Record<string, any> = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      abstract: abstract.trim(),
      methodology: methodology.trim() || undefined,
      category,
      visibility,
      authors,
      publication_url: publicationUrl.trim() || undefined,
      repository_url: repositoryUrl.trim() || undefined,
      dataset_url: datasetUrl.trim() || undefined,
      linked_event_id: linkedEventId.trim() || undefined,
      linked_project_id: linkedProjectId.trim() || undefined,
    };

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/research/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = await res.json();
        setItem(body.data);
        setActionMessage({ type: 'success', text: 'Research details saved successfully.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to update research paper.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkflowAction = async (action: 'publish' | 'archive') => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/research/${itemId}/${action}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Research item ${action}ed successfully.` });
        fetchResearchDetails();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || `Failed to ${action} item.` });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error: ${err.message}` });
    }
  };

  const handleAddAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthorName.trim()) {
      alert('Author name is required.');
      return;
    }

    const newAuthor: ResearchAuthor = {
      name: newAuthorName.trim(),
      enrollment_number: newAuthorEnrollment.trim() || undefined,
      affiliation: newAuthorAffiliation.trim() || undefined,
      role: newAuthorRole.trim() || 'Contributor',
    };

    setAuthors((prev) => [...prev, newAuthor]);
    setNewAuthorName('');
    setNewAuthorEnrollment('');
    setNewAuthorAffiliation('');
    setNewAuthorRole('Contributor');
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
        <p>Loading research publication from API...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
        <h2 style={{ color: '#F8FAFC', marginBottom: '8px' }}>Research Publication Not Found</h2>
        <p>The requested research paper could not be loaded from the backend API.</p>
        <Link href="/research" style={{ display: 'inline-block', marginTop: '16px', color: '#38BDF8' }}>
          ← Back to Research
        </Link>
      </div>
    );
  }

  const sColor = STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Link & Header */}
      <div>
        <Link href="/research" style={{ color: '#38BDF8', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Back to Research Registry
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
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>{item.title}</h1>
              <span
                style={{
                  backgroundColor: sColor.bg,
                  color: sColor.text,
                  border: `1px solid ${sColor.border}`,
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {item.status}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              Category: {CATEGORY_LABELS[item.category]} • Slug: /{item.slug}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {item.status !== 'PUBLISHED' && (
              <button
                onClick={() => handleWorkflowAction('publish')}
                style={{
                  backgroundColor: '#00763C',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Publish Paper
              </button>
            )}
            {item.status !== 'ARCHIVED' && (
              <button
                onClick={() => handleWorkflowAction('archive')}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Archive
              </button>
            )}
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

      {/* 2-Column Editorial Grid */}
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
            Academic Metadata & Abstract
          </h2>
          <form onSubmit={handleSaveResearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Paper Title *
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Abstract *
              </label>
              <textarea
                required
                rows={5}
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Methodology & Setup
              </label>
              <textarea
                rows={3}
                placeholder="Hardware specifications, datasets utilized, benchmarks..."
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ResearchCategory)}
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
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as ResearchVisibility)}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Publication / ArXiv URL (https://)
              </label>
              <input
                type="url"
                value={publicationUrl}
                onChange={(e) => setPublicationUrl(e.target.value)}
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
                  Repository URL (https://)
                </label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
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
                  value={datasetUrl}
                  onChange={(e) => setDatasetUrl(e.target.value)}
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
                {isSaving ? 'Saving...' : 'Save Research Metadata'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Author Attribution & Linkages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Author Roster Card */}
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
              Author Attribution & Affiliations
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {authors.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No authors specified yet.</div>
              ) : (
                authors.map((auth, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#0B0F14',
                      border: '1px solid #1E293B',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>{auth.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {auth.affiliation || 'Department of AIML'} • Role: {auth.role || 'Author'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAuthor(idx)}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Author Sub-Form */}
            <form onSubmit={handleAddAuthor} style={{ borderTop: '1px solid #1E293B', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#CBD5E1' }}>+ Append Author</h3>
              <input
                type="text"
                placeholder="Author Name *"
                value={newAuthorName}
                onChange={(e) => setNewAuthorName(e.target.value)}
                style={{
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '6px 10px',
                  fontSize: '0.8125rem',
                }}
              />
              <input
                type="text"
                placeholder="Affiliation (e.g. OCT AIML)"
                value={newAuthorAffiliation}
                onChange={(e) => setNewAuthorAffiliation(e.target.value)}
                style={{
                  backgroundColor: '#0B0F14',
                  border: '1px solid #1E293B',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  padding: '6px 10px',
                  fontSize: '0.8125rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00763C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add Author
                </button>
              </div>
            </form>
          </div>

          {/* Linkages Card */}
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
              Ecosystem Associations
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Linked Event:</span>
                <span style={{ color: '#38BDF8' }}>{item.linked_event_title || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Linked Project:</span>
                <span style={{ color: '#38BDF8' }}>{item.linked_project_title || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Published Date:</span>
                <span style={{ color: '#F8FAFC' }}>
                  {item.published_at ? new Date(item.published_at).toLocaleString() : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
