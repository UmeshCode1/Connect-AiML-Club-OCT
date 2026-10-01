'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Project, ProjectStatus, ProjectVisibility } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  IDEA: { bg: '#78350F22', text: '#FDE68A', border: '#D97706' },
  IN_DEVELOPMENT: { bg: '#1E3A8A22', text: '#93C5FD', border: '#3B82F6' },
  COMPLETED: { bg: '#064E3B22', text: '#6EE7B7', border: '#10B981' },
  ARCHIVED: { bg: '#18181B55', text: '#94A3B8', border: '#475569' },
};

const VISIBILITY_COLORS: Record<ProjectVisibility, { bg: string; text: string }> = {
  PUBLIC: { bg: '#064E3B33', text: '#6EE7B7' },
  AUTHENTICATED: { bg: '#1E3A8A33', text: '#93C5FD' },
  TEAM_ONLY: { bg: '#78350F33', text: '#FDE68A' },
  HIDDEN: { bg: '#33415533', text: '#CBD5E1' },
};
// Real API records only - no mock data

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTechStack, setNewTechStack] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newDemoUrl, setNewDemoUrl] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('IN_DEVELOPMENT');
  const [newVisibility, setNewVisibility] = useState<ProjectVisibility>('PUBLIC');
  const [newIsFeatured, setNewIsFeatured] = useState(false);
  const [newLinkedEventId, setNewLinkedEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    projectId: string;
    action: 'publish' | 'archive';
    title: string;
  }>({ isOpen: false, projectId: '', action: 'publish', title: '' });

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let url = `${apiUrl}/v1/projects?page_size=50`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (visibilityFilter !== 'ALL') url += `&visibility=${visibilityFilter}`;
      if (featuredFilter === 'FEATURED') url += `&is_featured=true`;
      if (featuredFilter === 'STANDARD') url += `&is_featured=false`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });
      if (res.ok) {
        const body = await res.json();
        setProjects(body.data || []);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('Failed to fetch projects in admin:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, visibilityFilter, featuredFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setVisibilityFilter('ALL');
    setFeaturedFilter('ALL');
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+/i.test(url.trim());
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim() || !newDescription.trim()) {
      setActionMessage({ type: 'error', text: 'Title, Summary, and Description are required.' });
      return;
    }

    if (!validateUrl(newRepoUrl) || !validateUrl(newDemoUrl) || !validateUrl(newDocUrl)) {
      setActionMessage({ type: 'error', text: 'External URLs must use safe http:// or https:// protocols.' });
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);

    const techArray = newTechStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
      title: newTitle.trim(),
      summary: newSummary.trim(),
      description: newDescription.trim(),
      status: newStatus,
      visibility: newVisibility,
      is_featured: newIsFeatured,
      technology_stack: techArray,
    };

    if (newSlug.trim()) payload.slug = newSlug.trim();
    if (newRepoUrl.trim()) payload.repository_url = newRepoUrl.trim();
    if (newDemoUrl.trim()) payload.demo_url = newDemoUrl.trim();
    if (newDocUrl.trim()) payload.documentation_url = newDocUrl.trim();
    if (newLinkedEventId.trim()) payload.linked_event_id = newLinkedEventId.trim();

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Project "${newTitle}" created successfully.` });
        setIsCreateModalOpen(false);
        // Reset form
        setNewTitle('');
        setNewSlug('');
        setNewSummary('');
        setNewDescription('');
        setNewTechStack('');
        setNewRepoUrl('');
        setNewDemoUrl('');
        setNewDocUrl('');
        setNewStatus('IN_DEVELOPMENT');
        setNewVisibility('PUBLIC');
        setNewIsFeatured(false);
        setNewLinkedEventId('');
        fetchProjects();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to create project.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeProjectAction = async (projectId: string, action: 'publish' | 'archive') => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects/${projectId}/${action}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Project successfully ${action}ed.` });
        fetchProjects();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || `Failed to ${action} project.` });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setConfirmDialog({ isOpen: false, projectId: '', action: 'publish', title: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Quick Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Projects & Innovation Showcase</h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
            Moderate student submissions, review lifecycle milestones, and manage contributor attributions.
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
          <span>+</span> Create Project
        </button>
      </div>

      {/* Action Message Banner */}
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

      {/* Search & Filter Bar */}
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
          {/* Debounced Search */}
          <input
            type="text"
            placeholder="Search projects by title, stack, or keywords..."
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

          {/* Status Filter */}
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
            <option value="IDEA">Idea</option>
            <option value="IN_DEVELOPMENT">In Development</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Visibility Filter */}
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
            <option value="TEAM_ONLY">Team Only</option>
            <option value="HIDDEN">Hidden</option>
          </select>

          {/* Featured Filter */}
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            style={{
              backgroundColor: '#0B0F14',
              border: '1px solid #1E293B',
              borderRadius: '6px',
              color: '#F8FAFC',
              padding: '8px 12px',
              fontSize: '0.875rem',
            }}
          >
            <option value="ALL">All Items</option>
            <option value="FEATURED">Featured Only</option>
            <option value="STANDARD">Standard</option>
          </select>
        </div>

        {(searchQuery || statusFilter !== 'ALL' || visibilityFilter !== 'ALL' || featuredFilter !== 'ALL') && (
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

      {/* Data Table */}
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
              <th style={{ padding: '12px 16px' }}>Project Title</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Visibility</th>
              <th style={{ padding: '12px 16px' }}>Tech Stack</th>
              <th style={{ padding: '12px 16px' }}>Linked Event</th>
              <th style={{ padding: '12px 16px' }}>Featured</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  Loading projects...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                  No projects found matching the filter criteria.
                </td>
              </tr>
            ) : (
              projects.map((proj) => {
                const sColor = STATUS_COLORS[proj.status] || STATUS_COLORS.IDEA;
                const vColor = VISIBILITY_COLORS[proj.visibility] || VISIBILITY_COLORS.PUBLIC;

                return (
                  <tr
                    key={proj.id}
                    style={{
                      borderBottom: '1px solid #1E293B',
                      transition: 'background-color 150ms ease',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Link
                        href={`/projects/${proj.id}`}
                        style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {proj.title}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        /{proj.slug}
                      </div>
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
                        {proj.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: vColor.bg,
                          color: vColor.text,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {proj.visibility}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                        {proj.technology_stack?.slice(0, 3).map((tech, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#1E293B',
                              color: '#CBD5E1',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '0.7rem',
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                        {(proj.technology_stack?.length || 0) > 3 && (
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                            +{(proj.technology_stack?.length || 0) - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                      {proj.linked_event_title || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {proj.is_featured ? (
                        <span style={{ color: '#F59E0B', fontWeight: 600, fontSize: '0.8rem' }}>★ Featured</span>
                      ) : (
                        <span style={{ color: '#475569', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          href={`/projects/${proj.id}`}
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
                        {proj.status !== 'ARCHIVED' && (
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                projectId: proj.id,
                                action: 'archive',
                                title: proj.title,
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

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
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
              <h2 id="create-project-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Submit New Project
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OCT Vision AI: Campus Safety"
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
                  placeholder="e.g. oct-vision-ai"
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
                  Summary * (Concise overview, max 280 chars)
                </label>
                <textarea
                  required
                  maxLength={280}
                  rows={2}
                  placeholder="Brief high-level summary of the innovation and its impact..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
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
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Comprehensive description of architecture, training pipeline, and results..."
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
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
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
                    <option value="IDEA">Idea</option>
                    <option value="IN_DEVELOPMENT">In Development</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                    Visibility
                  </label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as ProjectVisibility)}
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
                    <option value="TEAM_ONLY">Team Only</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Technology Stack (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, PyTorch, YOLOv8, FastAPI"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
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
                    Demo / Live URL (https://)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newDemoUrl}
                    onChange={(e) => setNewDemoUrl(e.target.value)}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#F8FAFC' }}>
                  <input
                    type="checkbox"
                    checked={newIsFeatured}
                    onChange={(e) => setNewIsFeatured(e.target.checked)}
                  />
                  Feature this project on public homepage and showcase showcase banner
                </label>
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
                  {isSubmitting ? 'Submitting...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive / Workflow Actions */}
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
              {confirmDialog.action === 'archive' && ' Archiving will hide the project from standard discovery.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setConfirmDialog({ isOpen: false, projectId: '', action: 'publish', title: '' })}
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
                onClick={() => executeProjectAction(confirmDialog.projectId, confirmDialog.action)}
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
