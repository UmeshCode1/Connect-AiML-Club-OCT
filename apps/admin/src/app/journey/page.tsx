'use client';

import React, { useState, useEffect } from 'react';
import type { JourneyMilestone, JourneyMilestoneType, JourneyMilestoneStatus } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

export default function JourneyAdminPage() {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<JourneyMilestoneType>('ACHIEVEMENT');
  const [newDescription, setNewDescription] = useState('');
  const [newLinkedEventId, setNewLinkedEventId] = useState('');
  const [newExternalLink, setNewExternalLink] = useState('');
  const [newDisplayOrder, setNewDisplayOrder] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      let url = `${apiUrl}/v1/journey?page_size=50`;
      if (typeFilter !== 'ALL') {
        url += `&milestone_type=${typeFilter}`;
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
        setMilestones(data.data || []);
      }
    } catch {
      // Sample fallback if API is not running during build
      setMilestones([
        {
          id: '00000000-0000-0000-0000-000000000801',
          title: 'Foundation of AI & ML Club, Oriental College of Technology',
          slug: 'foundation-of-aiml-club-oct',
          milestone_date: '2024-08-15',
          milestone_type: 'FOUNDATION',
          description: 'Establishment of the dedicated AI & Machine Learning student chapter at Oriental College of Technology, Bhopal under the leadership of student coordinators and institutional faculty advisors.',
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          display_order: 0,
          published_at: '2024-08-15T12:00:00Z',
          created_at: '2024-08-15T12:00:00Z',
          updated_at: '2024-08-15T12:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newDescription.trim()) {
      alert('Title, Milestone Date, and Description are required.');
      return;
    }

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const payload: Record<string, any> = {
        title: newTitle.trim(),
        milestone_date: newDate,
        milestone_type: newType,
        description: newDescription.trim(),
        display_order: newDisplayOrder,
        status: 'PUBLISHED',
      };
      if (newSlug.trim()) {
        payload.slug = newSlug.trim();
      }
      if (newLinkedEventId.trim()) {
        payload.linked_event_id = newLinkedEventId.trim();
      }
      if (newExternalLink.trim()) {
        payload.external_link = newExternalLink.trim();
      }

      const res = await fetch(`${apiUrl}/v1/journey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionMessage('Milestone created and published successfully.');
        setIsCreating(false);
        setNewTitle('');
        setNewSlug('');
        setNewDate('');
        setNewDescription('');
        setNewLinkedEventId('');
        setNewExternalLink('');
        setNewDisplayOrder(0);
        fetchMilestones();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to create milestone.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/journey/${id}/publish`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dev-admin-token',
        },
      });

      if (res.ok) {
        setActionMessage('Milestone published to public timeline.');
        fetchMilestones();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to publish milestone.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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
            Institutional Journey & Timeline
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Record historical milestones, awards, inaugurations, and institutional partnerships of AIML CLUB OCT.
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
          {isCreating ? 'Close Form' : '+ Add Historical Milestone'}
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
            Record Institutional Milestone
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Milestone Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Inauguration of GPU Computing Lab"
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
                Date (YYYY-MM-DD) *
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
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
                Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as JourneyMilestoneType)}
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
                <option value="FOUNDATION">Foundation</option>
                <option value="EVENT">Event</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="LEADERSHIP">Leadership</option>
                <option value="RESEARCH">Research</option>
                <option value="COLLABORATION">Collaboration</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                Linked Event ID (Canonical)
              </label>
              <input
                type="text"
                value={newLinkedEventId}
                onChange={(e) => setNewLinkedEventId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000101"
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
              Milestone Narrative / Description *
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={4}
              placeholder="Historical background, key faculty/student contributors, and significance..."
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.9rem',
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
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Category:</span>
          {['ALL', 'FOUNDATION', 'EVENT', 'ACHIEVEMENT', 'PARTNERSHIP', 'RESEARCH'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTypeFilter(cat)}
              style={{
                backgroundColor: typeFilter === cat ? '#014B7A' : '#1E293B',
                color: typeFilter === cat ? '#FFFFFF' : '#94A3B8',
                border: '1px solid #334155',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                minHeight: '36px',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMilestones()}
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
            onClick={fetchMilestones}
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

      {/* Timeline Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
          Loading historical timeline...
        </div>
      ) : milestones.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#111820',
          borderRadius: '8px',
          border: '1px solid #1E293B',
          color: '#94A3B8',
        }}>
          No milestones recorded matching current filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {milestones.map((ms) => (
            <div
              key={ms.id}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    backgroundColor: '#014B7A22',
                    color: '#38BDF8',
                    border: '1px solid #014B7A55',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>
                    {ms.milestone_type}
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#A3E635' }}>
                    {ms.milestone_date}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: ms.status === 'PUBLISHED' ? '#064E3B' : '#334155',
                    color: ms.status === 'PUBLISHED' ? '#6EE7B7' : '#94A3B8',
                    fontWeight: 700,
                  }}>
                    {ms.status}
                  </span>
                  {ms.status !== 'PUBLISHED' && (
                    <button
                      onClick={() => handlePublish(ms.id)}
                      style={{
                        backgroundColor: '#00763C',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC', margin: '0 0 6px 0' }}>
                  {ms.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#CBD5E1', lineHeight: '1.5', margin: 0 }}>
                  {ms.description}
                </p>
              </div>

              {ms.linked_event_id && (
                <div style={{
                  fontSize: '0.8rem',
                  color: '#38BDF8',
                  backgroundColor: '#0B0F14',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #1E293B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>Linked Canonical Event:</span>
                  <span style={{ fontWeight: 600 }}>{ms.linked_event_title || ms.linked_event_id}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
