'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface EventDetail {
  id: string;
  event_code: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  event_type: string;
  status: string;
  visibility: string;
  venue: string;
  capacity: number;
  confirmed_count: number;
  waitlisted_count: number;
  cancelled_count: number;
  start_at: string;
  end_at: string;
  registration_open_at: string;
  registration_close_at: string;
  published_at?: string;
}

const SAMPLE_DETAIL: EventDetail = {
  id: '00000000-0000-0000-0000-000000000101',
  event_code: 'EVT-APTIFY-2026',
  slug: 'aptify-2026',
  title: 'Aptify 2.0: AI Symposium',
  short_description: 'Flagship AI symposium and workshop at Oriental College of Technology.',
  description:
    'Comprehensive student symposium featuring AI keynote speakers, workshops, code sprints, and verified participation credentials.',
  event_type: 'SYMPOSIUM',
  status: 'REGISTRATION_OPEN',
  visibility: 'PUBLIC',
  venue: 'Auditorium, Oriental College of Technology, Bhopal',
  capacity: 250,
  confirmed_count: 142,
  waitlisted_count: 12,
  cancelled_count: 3,
  start_at: '2026-10-15T09:30:00Z',
  end_at: '2026-10-15T17:00:00Z',
  registration_open_at: '2026-09-01T00:00:00Z',
  registration_close_at: '2026-10-14T23:59:59Z',
  published_at: '2026-09-01T00:00:00Z',
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PLANNING', 'ARCHIVED'],
  PLANNING: ['REGISTRATION_OPEN', 'DRAFT', 'ARCHIVED'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'LIVE', 'ARCHIVED'],
  REGISTRATION_CLOSED: ['REGISTRATION_OPEN', 'LIVE', 'ARCHIVED'],
  LIVE: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['MEDIA_PROCESSING', 'CERTIFICATES', 'ARCHIVED'],
  MEDIA_PROCESSING: ['CERTIFICATES', 'COMPLETED', 'ARCHIVED'],
  CERTIFICATES: ['ARCHIVED', 'COMPLETED'],
  ARCHIVED: [],
};

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<EventDetail>(SAMPLE_DETAIL);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const availableTransitions = ALLOWED_TRANSITIONS[event.status] || [];

  const handleExecuteTransition = () => {
    if (!selectedTargetStatus) return;
    setIsProcessing(true);
    setTimeout(() => {
      setEvent((prev) => ({ ...prev, status: selectedTargetStatus }));
      setSelectedTargetStatus(null);
      setTransitionReason('');
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div>
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/events" style={{ color: '#38BDF8', fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px' }}>
          ← Back to Events List
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>{event.title}</h1>
              <span
                style={{
                  backgroundColor: '#064E3B',
                  color: '#6EE7B7',
                  border: '1px solid #10B981',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {event.status}
              </span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginTop: '4px', fontFamily: 'monospace' }}>
              {event.event_code} • {event.slug} • {event.event_type}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href={`/events/${resolvedParams.id}/sessions`}
              style={{
                backgroundColor: '#014B7A',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Sessions & Attendance
            </Link>
            <Link
              href={`/events/${resolvedParams.id}/volunteers`}
              style={{
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Volunteers
            </Link>
            <Link
              href={`/events/${resolvedParams.id}/media`}
              style={{
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Media Assets
            </Link>
            <Link
              href={`/events/${resolvedParams.id}/participants`}
              style={{
                backgroundColor: '#1E293B',
                color: '#E2E8F0',
                border: '1px solid #334155',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Roster ({event.confirmed_count})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>CAPACITY UTILIZATION</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>
            {Math.round((event.confirmed_count / event.capacity) * 100)}%
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>
            {event.confirmed_count} / {event.capacity} seats filled
          </div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>WAITLISTED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
            {event.waitlisted_count}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>Auto-promoted upon cancellation</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>CANCELLED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', marginTop: '4px' }}>
            {event.cancelled_count}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>Released back to waitlist</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>VISIBILITY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            {event.visibility}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>Public Student PWA</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '14px' }}>Overview & Details</h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {event.description}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Venue: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.venue}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Event Date: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.start_at.slice(0, 10)}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Registration Opens: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.registration_open_at.slice(0, 10)}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Registration Closes: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.registration_close_at.slice(0, 10)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Lifecycle Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '12px' }}>
              Lifecycle Status Controls
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '16px' }}>
              Transitions are validated server-side by the finite state machine.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>
                CURRENT STATE
              </span>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#0B0F14',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  color: '#38BDF8',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                {event.status}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                PERMITTED TRANSITIONS
              </span>
              {availableTransitions.length === 0 ? (
                <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Terminal state. No further transitions permitted.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableTransitions.map((targetStatus) => (
                    <button
                      key={targetStatus}
                      onClick={() => setSelectedTargetStatus(targetStatus)}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: '#1E293B',
                        color: targetStatus === 'ARCHIVED' ? '#F87171' : '#F8FAFC',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        minHeight: '44px',
                      }}
                    >
                      <span>Transition to {targetStatus}</span>
                      <span>→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedTargetStatus && (
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
              maxWidth: '480px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '8px' }}>
              Confirm Status Transition
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '16px' }}>
              Are you sure you want to transition this event from <strong>{event.status}</strong> to{' '}
              <strong style={{ color: '#38BDF8' }}>{selectedTargetStatus}</strong>?
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                Reason for change (recorded in audit log)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved by Club Lead for registration"
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedTargetStatus(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#1E293B',
                  color: '#CBD5E1',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransition}
                disabled={isProcessing}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#014B7A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  minHeight: '44px',
                }}
              >
                {isProcessing ? 'Updating...' : 'Confirm Transition'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
