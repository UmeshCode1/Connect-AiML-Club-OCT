'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Feedback, FeedbackSummary, FeedbackModerationStatus } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

export default function EventFeedbackAdminPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchFeedbackData = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

      // 1. Fetch feedbacks
      let listUrl = `${apiUrl}/v1/events/${eventId}/feedback?page_size=50`;
      if (statusFilter !== 'ALL') {
        listUrl += `&moderation_status=${statusFilter}`;
      }
      const listRes = await fetch(listUrl, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });
      if (listRes.ok) {
        const body = await listRes.json();
        setFeedbacks(body.data || []);
      }

      // 2. Fetch summary
      const sumRes = await fetch(`${apiUrl}/v1/events/${eventId}/feedback/summary`);
      if (sumRes.ok) {
        const sumBody = await sumRes.json();
        setSummary(sumBody.data);
      }
    } catch {
      // Fallback data for build or offline mock
      setFeedbacks([
        {
          id: '00000000-0000-0000-0000-000000000901',
          event_id: eventId,
          student_id: '00000000-0000-0000-0000-000000000011',
          source: 'PORTAL',
          rating: 5,
          feedback_text: 'The computer vision hands-on session was exceptionally structured and practical!',
          suggestion_text: 'Would love an advanced multi-modal agent track in the next workshop.',
          publication_consent: 'PUBLIC_NAME',
          is_anonymous: false,
          moderation_status: 'APPROVED',
          visibility: 'PUBLIC',
          student: {
            id: '00000000-0000-0000-0000-000000000011',
            full_name: 'Aarav Sharma',
            enrollment_number: '0126AL221001',
          },
          created_at: '2026-03-01T17:00:00Z',
          updated_at: '2026-03-02T10:00:00Z',
        },
      ]);
      setSummary({
        event_id: eventId,
        total_feedback: 1,
        average_rating: 5.0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
        pending_moderation_count: 0,
        approved_count: 1,
        rejected_count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchFeedbackData();
    }
  }, [eventId, statusFilter]);

  const handleModerate = async (feedbackId: string, status: FeedbackModerationStatus) => {
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-admin-token',
        },
        body: JSON.stringify({
          moderation_status: status,
          moderation_notes: `Moderated to ${status} by admin console.`,
        }),
      });

      if (res.ok) {
        setActionMessage(`Feedback marked as ${status}.`);
        fetchFeedbackData();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Moderation action failed.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
        <Link href="/events" style={{ color: '#94A3B8', textDecoration: 'none' }}>
          Events
        </Link>
        <span style={{ color: '#64748B' }}>/</span>
        <Link href={`/events/${eventId}`} style={{ color: '#38BDF8', textDecoration: 'none' }}>
          Event Details
        </Link>
        <span style={{ color: '#64748B' }}>/</span>
        <span style={{ color: '#F8FAFC', fontWeight: 600 }}>Feedback & Moderation</span>
      </div>

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
            Event Feedback & Review Moderation
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Inspect attendee ratings, review qualitative suggestions, and moderate feedback for public showcase.
          </p>
        </div>
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

      {/* Summary Metrics */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Average Rating
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
              ★ {summary.average_rating.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748B' }}>/ 5.0</span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Submissions
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
              {summary.total_feedback}
            </div>
          </div>

          <div style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Moderation
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FCD34D', marginTop: '4px' }}>
              {summary.pending_moderation_count}
            </div>
          </div>

          <div style={{
            backgroundColor: '#111820',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Approved Public
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6EE7B7', marginTop: '4px' }}>
              {summary.approved_count}
            </div>
          </div>
        </div>
      )}

      {/* Moderation Filter */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: '#111820',
        padding: '12px 18px',
        borderRadius: '8px',
        border: '1px solid #1E293B',
      }}>
        <span style={{ fontSize: '0.85rem', color: '#94A3B8', marginRight: '6px' }}>Status Filter:</span>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              backgroundColor: statusFilter === st ? '#014B7A' : '#1E293B',
              color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
              border: '1px solid #334155',
              padding: '6px 12px',
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

      {/* Feedback Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
          Loading event feedback...
        </div>
      ) : feedbacks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: '#111820',
          borderRadius: '8px',
          border: '1px solid #1E293B',
          color: '#94A3B8',
        }}>
          No feedback entries found matching filter criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
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
                  <span style={{ fontSize: '1.2rem', color: '#F59E0B' }}>
                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    backgroundColor: fb.moderation_status === 'APPROVED' ? '#064E3B' : fb.moderation_status === 'REJECTED' ? '#450A0A' : '#78350F',
                    color: fb.moderation_status === 'APPROVED' ? '#6EE7B7' : fb.moderation_status === 'REJECTED' ? '#FCA5A5' : '#FCD34D',
                  }}>
                    {fb.moderation_status}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#1E293B',
                    color: '#94A3B8',
                  }}>
                    Consent: {fb.publication_consent}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Submitted on {new Date(fb.created_at).toLocaleString()}
                </div>
              </div>

              {fb.feedback_text && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Feedback:</div>
                  <p style={{ fontSize: '0.95rem', color: '#F1F5F9', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    {fb.feedback_text}
                  </p>
                </div>
              )}

              {fb.suggestion_text && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Suggestions for Improvement:</div>
                  <p style={{ fontSize: '0.9rem', color: '#CBD5E1', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                    {fb.suggestion_text}
                  </p>
                </div>
              )}

              {/* Private Attendee Info (Admin Access Only) */}
              <div style={{
                backgroundColor: '#0B0F14',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #1E293B',
                fontSize: '0.8rem',
                color: '#64748B',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
              }}>
                <span>Student: <strong style={{ color: '#E2E8F0' }}>{fb.student?.full_name || 'Verified Participant'}</strong></span>
                {fb.student?.enrollment_number && (
                  <span>Enrollment: <strong style={{ color: '#38BDF8' }}>{fb.student.enrollment_number}</strong></span>
                )}
                <span>Visibility: <strong style={{ color: fb.visibility === 'PUBLIC' ? '#6EE7B7' : '#94A3B8' }}>{fb.visibility}</strong></span>
              </div>

              {/* Moderation Controls */}
              <div style={{
                marginTop: '6px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
              }}>
                {fb.moderation_status !== 'APPROVED' && (
                  <button
                    onClick={() => handleModerate(fb.id, 'APPROVED')}
                    style={{
                      backgroundColor: '#00763C',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    Approve for Showcase
                  </button>
                )}

                {fb.moderation_status !== 'REJECTED' && (
                  <button
                    onClick={() => handleModerate(fb.id, 'REJECTED')}
                    style={{
                      backgroundColor: '#7F1D1D',
                      color: '#FCA5A5',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '36px',
                    }}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
