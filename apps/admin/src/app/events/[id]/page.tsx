'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

import { normalizeApiUrl } from '@connect/config';

interface EventDetail {
  id: string;
  event_code: string;
  slug: string;
  title: string;
  short_description?: string;
  description?: string;
  event_type: string;
  status: string;
  visibility: string;
  venue?: string;
  capacity?: number;
  confirmed_count?: number;
  waitlisted_count?: number;
  cancelled_count?: number;
  start_at: string;
  end_at: string;
  registration_open_at?: string;
  registration_close_at?: string;
  published_at?: string;
}

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
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTargetStatus, setSelectedTargetStatus] = useState<string | null>(null);
  const [transitionReason, setTransitionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      try {
        const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
        const res = await fetch(`${apiUrl}/v1/events/${resolvedParams.id}`, {
          headers: { Authorization: 'Bearer dev-admin-token' },
        });
        if (res.ok) {
          const body = await res.json();
          setEvent(body.data);
        } else {
          setEvent(null);
        }
      } catch (err) {
        console.error('Failed to fetch event details in admin:', err);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>
        Loading operational event records...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: '#F87171', fontSize: '1.1rem', fontWeight: 600 }}>Event not found</p>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '6px' }}>
          The requested event record does not exist or has been permanently removed.
        </p>
        <Link href="/events" style={{ color: '#38BDF8', fontSize: '0.875rem', marginTop: '16px', display: 'inline-block' }}>
          ← Back to Events Roster
        </Link>
      </div>
    );
  }

  const availableTransitions = ALLOWED_TRANSITIONS[event.status] || [];

  const handleExecuteTransition = () => {
    if (!selectedTargetStatus) return;
    setIsProcessing(true);
    setTimeout(() => {
      setEvent((prev) => (prev ? { ...prev, status: selectedTargetStatus } : null));
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
              href={`/events/${resolvedParams.id}/certificates`}
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
              Certificates & Verification
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
            <Link
              href={`/events/${resolvedParams.id}/feedback`}
              style={{
                backgroundColor: '#1E293B',
                color: '#FCD34D',
                border: '1px solid #78350F',
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
              ★ Feedback
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>CAPACITY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>
            {event.capacity ? `${event.capacity}` : 'Unlimited'}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>
            {event.confirmed_count !== undefined ? `${event.confirmed_count} confirmed attendees` : 'Capacity limit configured'}
          </div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>EVENT TYPE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            {event.event_type}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>Official Chapter Program</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>STATUS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {event.status}
          </div>
          <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>Lifecycle state</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>VISIBILITY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '14px' }}>Overview &amp; Details</h2>
            <p style={{ color: '#CBD5E1', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {event.description || event.short_description || 'No description provided.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Venue: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.venue || 'TBA'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Event Date: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.start_at ? event.start_at.slice(0, 10) : '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Registration Opens: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.registration_open_at ? event.registration_open_at.slice(0, 10) : '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Registration Closes: </span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{event.registration_close_at ? event.registration_close_at.slice(0, 10) : '—'}</span>
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
