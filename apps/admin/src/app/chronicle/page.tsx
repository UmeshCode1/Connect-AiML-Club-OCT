'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ChronicleEntry, ChronicleEditionType, ChronicleStatus } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

export default function ChronicleAdminPage() {
  const [entries, setEntries] = useState<ChronicleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState<ChronicleEditionType>('MONTHLY_DIGEST');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newLinkedEventId, setNewLinkedEventId] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Active preview
  const [previewEntry, setPreviewEntry] = useState<ChronicleEntry | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let url = `${apiUrl}/v1/chronicle?page_size=50`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (typeFilter !== 'ALL') {
        url += `&edition_type=${typeFilter}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: 'Bearer dev-admin-token',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data || []);
      }
    } catch {
      // Fallback sample data if API server is offline during build
      setEntries([
        {
          id: '00000000-0000-0000-0000-000000000701',
          title: 'Welcome to AIML Club Chronicle: Academic Year 2026',
          slug: 'welcome-to-aiml-club-chronicle-2026',
          edition_type: 'INSTITUTIONAL_ANNOUNCEMENT',
          excerpt: 'Official inaugurative edition of AIML CLUB OCT Chronicle covering key milestones, upcoming symposiums, and student research tracks.',
          content: '# Welcome to AIML Club Chronicle\n\nInnovate. Implement. Inspire.\n\nWe are pleased to introduce the official digital chronicle of AIML CLUB OCT.',
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          published_at: '2026-03-01T10:00:00Z',
          created_at: '2026-03-01T09:00:00Z',
          updated_at: '2026-03-01T10:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [statusFilter, typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Title and Content are required.');
      return;
    }

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const payload: Record<string, any> = {
        title: newTitle.trim(),
        edition_type: newType,
        excerpt: newExcerpt.trim() || undefined,
        content: newContent.trim(),
        scheduled_at: newScheduledAt || undefined,
      };
      if (newSlug.trim()) {
        payload.slug = newSlug.trim();
      }
      if (newLinkedEventId.trim()) {
        payload.linked_event_ids = [newLinkedEventId.trim()];
      }

      const res = await fetch(`${apiUrl}/v1/chronicle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionMessage('Chronicle draft created successfully.');
        setIsCreating(false);
        setNewTitle('');
        setNewSlug('');
        setNewExcerpt('');
        setNewContent('');
        setNewScheduledAt('');
        setNewLinkedEventId('');
        fetchEntries();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to create chronicle draft.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleWorkflowAction = async (id: string, action: 'submit-review' | 'approve' | 'publish') => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/chronicle/${id}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-admin-token',
        },
      });

      if (res.ok) {
        setActionMessage(`Action '${action}' succeeded.`);
        fetchEntries();
      } else {
        const err = await res.json();
        alert(err.error?.message || `Failed to execute ${action}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: ChronicleStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return { bg: '#064E3B', color: '#6EE7B7', label: 'PUBLISHED' };
      case 'REVIEW':
        return { bg: '#78350F', color: '#FCD34D', label: 'IN REVIEW' };
      case 'SCHEDULED':
        return { bg: '#1E3A8A', color: '#93C5FD', label: 'SCHEDULED' };
      case 'DRAFT':
        return { bg: '#334155', color: '#94A3B8', label: 'DRAFT' };
      case 'ARCHIVED':
        return { bg: '#450A0A', color: '#FCA5A5', label: 'ARCHIVED' };
      default:
        return { bg: '#1E293B', color: '#E2E8F0', label: status };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid #1E293B',
        paddingBottom: '20px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
            Chronicle Editorial Management
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Curate, review, schedule, and publish official editions and research digests for AIML CLUB OCT.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          style={{
            backgroundColor: '#014B7A',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '44px',
          }}
        >
          {isCreating ? 'Close Editor' : '+ New Chronicle Edition'}
        </button>
      </div>

      {actionMessage && (
        <div style={{
          backgroundColor: '#064E3B33',
          border: '1px solid #064E3B',
          color: '#6EE7B7',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.9rem',
        }}>
          {actionMessage}
        </div>
      )}

      {/* Creation Workspace */}
      {isCreating && (
        <form onSubmit={handleCreate} style={{
          backgroundColor: '#111820',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
            Draft New Chronicle Publication
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. October 2026 AI Research & Symposium Digest"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Custom Slug (Optional)
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. october-2026-ai-digest"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Edition Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ChronicleEditionType)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                }}
              >
                <option value="MONTHLY_DIGEST">Monthly Digest</option>
                <option value="WEEKLY_UPDATE">Weekly Update</option>
                <option value="EVENT_RECAP">Event Recap</option>
                <option value="RESEARCH_DIGEST">Research Digest</option>
                <option value="COMMUNITY_UPDATE">Community Update</option>
                <option value="INSTITUTIONAL_ANNOUNCEMENT">Institutional Announcement</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Canonical Event ID (Optional Link)
              </label>
              <input
                type="text"
                value={newLinkedEventId}
                onChange={(e) => setNewLinkedEventId(e.target.value)}
                placeholder="e.g. 00000000-0000-0000-0000-000000000101"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  minHeight: '44px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
              Summary / Excerpt
            </label>
            <textarea
              value={newExcerpt}
              onChange={(e) => setNewExcerpt(e.target.value)}
              rows={2}
              placeholder="Brief summary displayed on index cards and Open Graph cards..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
              Content Body (Markdown) *
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={8}
              placeholder="# Edition Title&#10;&#10;Editorial narrative, research abstracts, and student highlights..."
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                backgroundColor: '#1E293B',
                color: '#94A3B8',
                border: '1px solid #334155',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                minHeight: '44px',
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
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Save Draft
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        backgroundColor: '#111820',
        padding: '14px 18px',
        borderRadius: '8px',
        border: '1px solid #1E293B',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Status:</span>
          {['ALL', 'DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                backgroundColor: statusFilter === st ? '#014B7A' : '#1E293B',
                color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                minHeight: '36px',
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search chronicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEntries()}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
            }}
          />
          <button
            onClick={fetchEntries}
            style={{
              backgroundColor: '#1E293B',
              color: '#E2E8F0',
              border: '1px solid #334155',
              padding: '6px 14px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </div>
      </div>

      {/* Editorial Listing Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
          Loading chronicle publications...
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#111820',
          borderRadius: '8px',
          border: '1px solid #1E293B',
          color: '#94A3B8',
        }}>
          No chronicle entries found matching filter criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '20px',
        }}>
          {entries.map((entry) => {
            const badge = getStatusBadge(entry.status);
            return (
              <div
                key={entry.id}
                style={{
                  backgroundColor: '#111820',
                  border: '1px solid #1E293B',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{
                    backgroundColor: badge.bg,
                    color: badge.color,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    {badge.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {entry.edition_type}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px 0' }}>
                    {entry.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    slug: <code style={{ color: '#38BDF8' }}>{entry.slug}</code>
                  </div>
                </div>

                {entry.excerpt && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#94A3B8',
                    lineHeight: '1.4',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.excerpt}
                  </p>
                )}

                {entry.linked_events && entry.linked_events.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#00763C', fontWeight: 600 }}>
                    Linked: {entry.linked_events.map(ev => ev.event_title || ev.event_id).join(', ')}
                  </div>
                )}

                {/* Workflow Actions */}
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '14px',
                  borderTop: '1px solid #1E293B',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => setPreviewEntry(entry)}
                    style={{
                      backgroundColor: '#1E293B',
                      color: '#E2E8F0',
                      border: '1px solid #334155',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    Preview
                  </button>

                  {entry.status === 'DRAFT' && (
                    <button
                      onClick={() => handleWorkflowAction(entry.id, 'submit-review')}
                      style={{
                        backgroundColor: '#78350F',
                        color: '#FCD34D',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '36px',
                      }}
                    >
                      Submit for Review
                    </button>
                  )}

                  {entry.status === 'REVIEW' && (
                    <button
                      onClick={() => handleWorkflowAction(entry.id, 'approve')}
                      style={{
                        backgroundColor: '#1E3A8A',
                        color: '#93C5FD',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '36px',
                      }}
                    >
                      Approve
                    </button>
                  )}

                  {(entry.status === 'REVIEW' || entry.status === 'SCHEDULED' || entry.status === 'DRAFT') && (
                    <button
                      onClick={() => handleWorkflowAction(entry.id, 'publish')}
                      style={{
                        backgroundColor: '#00763C',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '36px',
                      }}
                    >
                      Publish Now
                    </button>
                  )}

                  {entry.status === 'PUBLISHED' && (
                    <span style={{ fontSize: '0.75rem', color: '#6EE7B7', alignSelf: 'center', marginLeft: 'auto' }}>
                      Published on {new Date(entry.published_at || entry.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#111820',
            border: '1px solid #334155',
            borderRadius: '10px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                backgroundColor: '#014B7A22',
                color: '#38BDF8',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                {previewEntry.edition_type}
              </span>
              <button
                onClick={() => setPreviewEntry(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
              {previewEntry.title}
            </h2>

            {previewEntry.excerpt && (
              <p style={{
                fontSize: '1rem',
                color: '#CBD5E1',
                borderLeft: '4px solid #014B7A',
                paddingLeft: '14px',
                margin: 0,
                fontStyle: 'italic',
              }}>
                {previewEntry.excerpt}
              </p>
            )}

            <div style={{
              backgroundColor: '#0B0F14',
              padding: '20px',
              borderRadius: '6px',
              color: '#E2E8F0',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {previewEntry.content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewEntry(null)}
                style={{
                  backgroundColor: '#014B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
