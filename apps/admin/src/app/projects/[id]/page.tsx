'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { Project, ProjectMember, ProjectMemberRole, ProjectStatus, ProjectVisibility } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

const ALLOWED_PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  IDEA: ['IN_DEVELOPMENT', 'ARCHIVED'],
  IN_DEVELOPMENT: ['COMPLETED', 'ARCHIVED', 'IDEA'],
  COMPLETED: ['IN_DEVELOPMENT', 'ARCHIVED'],
  ARCHIVED: [],
};

const STATUS_BADGES: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  IDEA: { bg: '#78350F22', text: '#FDE68A', border: '#D97706' },
  IN_DEVELOPMENT: { bg: '#1E3A8A22', text: '#93C5FD', border: '#3B82F6' },
  COMPLETED: { bg: '#064E3B22', text: '#6EE7B7', border: '#10B981' },
  ARCHIVED: { bg: '#18181B55', text: '#94A3B8', border: '#475569' },
};
// Real API records only
export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form edit state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [visibility, setVisibility] = useState<ProjectVisibility>('PUBLIC');
  const [isFeatured, setIsFeatured] = useState(false);
  const [linkedEventId, setLinkedEventId] = useState('');

  // Contributor state
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>('CONTRIBUTOR');
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);

  // Lifecycle transition state
  const [targetStatus, setTargetStatus] = useState<ProjectStatus | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects/${projectId}`, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        const body = await res.json();
        const data: Project = body.data;
        setProject(data);
        populateForm(data);
      } else {
        setActionMessage({ type: 'error', text: 'Project not found or failed to load from API.' });
      }
    } catch (err) {
      console.error('Failed to fetch project details in admin:', err);
      setActionMessage({ type: 'error', text: 'Could not connect to backend API server.' });
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: Project) => {
    setTitle(data.title || '');
    setSlug(data.slug || '');
    setSummary(data.summary || '');
    setDescription(data.description || '');
    setTechStack((data.technology_stack || []).join(', '));
    setRepoUrl(data.repository_url || '');
    setDemoUrl(data.demo_url || '');
    setDocUrl(data.documentation_url || '');
    setVisibility(data.visibility || 'PUBLIC');
    setIsFeatured(!!data.is_featured);
    setLinkedEventId(data.linked_event_id || '');
    setMembers(data.members || []);
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    return /^https?:\/\/.+/i.test(url.trim());
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !description.trim()) {
      setActionMessage({ type: 'error', text: 'Title, Summary, and Description are required.' });
      return;
    }

    if (!validateUrl(repoUrl) || !validateUrl(demoUrl) || !validateUrl(docUrl)) {
      setActionMessage({ type: 'error', text: 'All URLs must strictly use safe http:// or https:// schemes.' });
      return;
    }

    setIsSaving(true);
    setActionMessage(null);

    const techArray = techStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      summary: summary.trim(),
      description: description.trim(),
      technology_stack: techArray,
      visibility,
      is_featured: isFeatured,
      repository_url: repoUrl.trim() || undefined,
      demo_url: demoUrl.trim() || undefined,
      documentation_url: docUrl.trim() || undefined,
      linked_event_id: linkedEventId.trim() || undefined,
    };

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const body = await res.json();
        setProject(body.data);
        setActionMessage({ type: 'success', text: 'Project changes saved successfully.' });
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to update project.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Network error: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteTransition = async () => {
    if (!targetStatus || !project) return;

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let endpoint = `${apiUrl}/v1/projects/${projectId}`;
      let method = 'PATCH';
      let payload: any = { status: targetStatus };

      if (targetStatus === 'COMPLETED' && project.status !== 'COMPLETED') {
        endpoint = `${apiUrl}/v1/projects/${projectId}/publish`;
        method = 'POST';
        payload = undefined;
      } else if (targetStatus === 'ARCHIVED') {
        endpoint = `${apiUrl}/v1/projects/${projectId}/archive`;
        method = 'POST';
        payload = undefined;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: `Project status transitioned to ${targetStatus}.` });
        setIsTransitionModalOpen(false);
        setTargetStatus(null);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        setActionMessage({ type: 'error', text: err.error?.message || 'Failed to transition status.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Error: ${err.message}` });
    }
  };

  // --------------------------------------------------------------------------
  // Contributor / Member Actions with Lead Protection
  // --------------------------------------------------------------------------

  const leadMembers = members.filter((m) => m.role === 'LEAD');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId.trim()) {
      alert('Student Profile UUID is required.');
      return;
    }

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify({
          student_id: newStudentId.trim(),
          role: newMemberRole,
          display_order: Number(newDisplayOrder) || 0,
        }),
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Contributor added to project.' });
        setIsAddMemberOpen(false);
        setNewStudentId('');
        setNewMemberRole('CONTRIBUTOR');
        setNewDisplayOrder(0);
        fetchProjectDetails();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to add member.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRemoveMember = async (studentId: string, memberRole: ProjectMemberRole) => {
    // Lead Protection: Cannot remove the sole project lead
    if (memberRole === 'LEAD' && leadMembers.length <= 1) {
      alert('Protection Rule: Cannot remove the sole project LEAD. Assign another LEAD before removing.');
      return;
    }

    if (!confirm('Are you sure you want to remove this contributor from the project?')) {
      return;
    }

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/projects/${projectId}/members/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer dev-admin-token' },
      });

      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Contributor removed from project.' });
        fetchProjectDetails();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to remove member.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
        <p>Loading project dossier from API...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>
        <h2 style={{ color: '#F8FAFC', marginBottom: '8px' }}>Project Not Found</h2>
        <p>The requested project record could not be loaded from the backend API.</p>
        <Link href="/projects" style={{ display: 'inline-block', marginTop: '16px', color: '#38BDF8' }}>
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const currentBadge = STATUS_BADGES[project.status] || STATUS_BADGES.IDEA;
  const validTransitions = ALLOWED_PROJECT_TRANSITIONS[project.status] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation & Header */}
      <div>
        <Link href="/projects" style={{ color: '#38BDF8', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Back to Projects List
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
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>{project.title}</h1>
              <span
                style={{
                  backgroundColor: currentBadge.bg,
                  color: currentBadge.text,
                  border: `1px solid ${currentBadge.border}`,
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {project.status.replace('_', ' ')}
              </span>
              {project.is_featured && (
                <span
                  style={{
                    backgroundColor: '#F59E0B22',
                    color: '#F59E0B',
                    border: '1px solid #F59E0B55',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  ★ FEATURED
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
              Slug: /{project.slug} • Created: {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Lifecycle State Controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {validTransitions.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setTargetStatus(st);
                  setIsTransitionModalOpen(true);
                }}
                style={{
                  backgroundColor: st === 'COMPLETED' ? '#00763C' : st === 'ARCHIVED' ? '#DC2626' : '#014B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Transition to {st.replace('_', ' ')}
              </button>
            ))}
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

      {/* Main Content Layout: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Project Form */}
        <div
          style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
            Project Specification & Metadata
          </h2>
          <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Summary (Max 280 chars) *
              </label>
              <textarea
                required
                maxLength={280}
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
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
                Full Description (Markdown) *
              </label>
              <textarea
                required
                rows={5}
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
                  onChange={(e) => setVisibility(e.target.value as ProjectVisibility)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Linked Event ID
                </label>
                <input
                  type="text"
                  placeholder="UUID of associated symposium/hackathon"
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                Technology Stack (Comma separated)
              </label>
              <input
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
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
                Repository URL (https://)
              </label>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
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
                  Live Demo URL (https://)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
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
                  Documentation URL (https://)
                </label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Mark as Featured Project on public showcases
              </label>
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
                {isSaving ? 'Saving Changes...' : 'Save Project Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Editorial & Contributor Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Editorial Roster Card */}
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: '#F8FAFC' }}>
              Editorial Audit & State
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Current Lifecycle Status:</span>
                <span style={{ fontWeight: 600, color: currentBadge.text }}>{project.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Publication Timestamp:</span>
                <span style={{ color: '#F8FAFC' }}>
                  {project.published_at ? new Date(project.published_at).toLocaleString() : 'Not Published'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: '8px' }}>
                <span style={{ color: '#94A3B8' }}>Associated Event:</span>
                <span style={{ color: '#38BDF8' }}>{project.linked_event_title || 'None'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94A3B8' }}>Total Verified Contributors:</span>
                <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{members.length}</span>
              </div>
            </div>
          </div>

          {/* Contributor / Member Management Card */}
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F8FAFC' }}>
                Project Contributors & Attributions
              </h2>
              <button
                onClick={() => setIsAddMemberOpen(true)}
                style={{
                  backgroundColor: '#00763C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add Contributor
              </button>
            </div>

            {members.length === 0 ? (
              <div style={{ color: '#94A3B8', fontSize: '0.875rem', padding: '16px 0' }}>
                No contributors associated with this project yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {members.map((m) => {
                  const isSoleLead = m.role === 'LEAD' && leadMembers.length <= 1;

                  return (
                    <div
                      key={m.id}
                      style={{
                        backgroundColor: '#0B0F14',
                        border: '1px solid #1E293B',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.875rem' }}>
                          {m.student?.full_name || 'Verified Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Enrollment: {m.student?.enrollment_number || m.student_id}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            backgroundColor: m.role === 'LEAD' ? '#1E3A8A44' : '#33415544',
                            color: m.role === 'LEAD' ? '#60A5FA' : '#94A3B8',
                            border: `1px solid ${m.role === 'LEAD' ? '#3B82F6' : '#475569'}`,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {m.role}
                        </span>

                        <button
                          onClick={() => handleRemoveMember(m.student_id, m.role)}
                          disabled={isSoleLead}
                          title={isSoleLead ? 'Cannot remove the sole project LEAD' : 'Remove contributor'}
                          style={{
                            backgroundColor: 'transparent',
                            color: isSoleLead ? '#475569' : '#EF4444',
                            border: 'none',
                            fontSize: '0.8125rem',
                            cursor: isSoleLead ? 'not-allowed' : 'pointer',
                            opacity: isSoleLead ? 0.5 : 1,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contributor Modal */}
      {isAddMemberOpen && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Add Project Contributor</h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Student Profile UUID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 00000000-0000-0000-0000-000000000301"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
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
                  Attribution Role
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as ProjectMemberRole)}
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
                  <option value="LEAD">LEAD</option>
                  <option value="CONTRIBUTOR">CONTRIBUTOR</option>
                  <option value="MENTOR">MENTOR</option>
                  <option value="ADVISOR">ADVISOR</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px', color: '#CBD5E1' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={newDisplayOrder}
                  onChange={(e) => setNewDisplayOrder(Number(e.target.value))}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00763C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}
                >
                  Add Contributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* State Machine Transition Confirmation Modal */}
      {isTransitionModalOpen && targetStatus && (
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
              Confirm Lifecycle Transition
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '20px' }}>
              Transition project from <strong style={{ color: '#F8FAFC' }}>{project.status}</strong> to{' '}
              <strong style={{ color: '#38BDF8' }}>{targetStatus}</strong>?
              {targetStatus === 'ARCHIVED' && ' Archiving will hide the project from public showcase searches.'}
              {targetStatus === 'COMPLETED' && ' Completing will make the project eligible for public showcase.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setIsTransitionModalOpen(false);
                  setTargetStatus(null);
                }}
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
                Cancel
              </button>
              <button
                onClick={handleExecuteTransition}
                style={{
                  backgroundColor: '#014B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
