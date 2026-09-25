'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface SessionItem {
  id: string;
  session_code: string;
  title: string;
  description?: string;
  venue: string;
  start_at: string;
  end_at: string;
  capacity?: number;
  status: string;
}

const INITIAL_SESSIONS: SessionItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000501',
    session_code: 'SES-APT-01',
    title: 'Opening Keynote & AI Architectures',
    description: 'Foundational keynote on modern AI architectures and practical engineering workflows.',
    venue: 'Auditorium, Oriental College of Technology, Bhopal',
    start_at: '2026-10-15 09:30 AM',
    end_at: '2026-10-15 12:00 PM',
    capacity: 250,
    status: 'SCHEDULED',
  },
  {
    id: '00000000-0000-0000-0000-000000000502',
    session_code: 'SES-APT-02',
    title: 'Deep Learning & Vision Transformers Workshop',
    description: 'Hands-on PyTorch workshop building vision models and model fine-tuning.',
    venue: 'Computer Center Lab 2, OCT',
    start_at: '2026-10-15 01:30 PM',
    end_at: '2026-10-15 04:00 PM',
    capacity: 100,
    status: 'SCHEDULED',
  },
];

export default function EventSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [sessions, setSessions] = useState<SessionItem[]>(INITIAL_SESSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVenue, setNewVenue] = useState('Auditorium, Oriental College of Technology');
  const [newStart, setNewStart] = useState('2026-10-15 10:00 AM');
  const [newEnd, setNewEnd] = useState('2026-10-15 12:00 PM');
  const [newCapacity, setNewCapacity] = useState(150);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = `ses-${Date.now()}`;
    const newSession: SessionItem = {
      id: newId,
      session_code: `SES-APT-0${sessions.length + 1}`,
      title: newTitle.trim(),
      venue: newVenue.trim(),
      start_at: newStart,
      end_at: newEnd,
      capacity: newCapacity,
      status: 'SCHEDULED',
    };

    setSessions((prev) => [...prev, newSession]);
    setNewTitle('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
      SCHEDULED: { bg: '#1E3A8A', text: '#93C5FD', border: '#3B82F6' },
      LIVE: { bg: '#831843', text: '#F472B6', border: '#EC4899' },
      COMPLETED: { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
      CANCELLED: { bg: '#450A0A', text: '#FCA5A5', border: '#EF4444' },
    };
    const c = badgeColors[status] || { bg: '#334155', text: '#CBD5E1', border: '#475569' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          backgroundColor: c.bg,
          color: c.text,
          border: `1px solid ${c.border}`,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Link href={`/events/${resolvedParams.id}`} style={{ color: '#38BDF8', fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px' }}>
          ← Back to Event Details
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Event Sessions & Operations</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Multi-session scheduling, venue allocation, and live QR attendance check-in checkpoints.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            + Schedule New Session
          </button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {sessions.map((ses) => (
          <div
            key={ses.id}
            style={{
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#38BDF8' }}>{ses.session_code}</span>
                {getStatusBadge(ses.status)}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '6px' }}>{ses.title}</h3>
              {ses.description && (
                <p style={{ color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '12px' }}>
                  {ses.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#CBD5E1' }}>
                <div>📍 <span style={{ color: '#94A3B8' }}>Venue:</span> {ses.venue}</div>
                <div>🕒 <span style={{ color: '#94A3B8' }}>Timing:</span> {ses.start_at} – {ses.end_at}</div>
                <div>👥 <span style={{ color: '#94A3B8' }}>Capacity:</span> {ses.capacity} seats</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1E293B', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                href={`/events/${resolvedParams.id}/sessions/${ses.id}/attendance`}
                style={{
                  backgroundColor: '#00763C',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📷 Take Attendance (QR / Manual)</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Session Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '16px' }}>
              Schedule Operational Session
            </h3>
            <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitive Algorithmic Sprint"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  Venue Location
                </label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0B0F14',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                    End Time
                  </label>
                  <input
                    type="text"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0B0F14',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#F8FAFC',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  Session Seat Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    color: '#CBD5E1',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: '#014B7A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
