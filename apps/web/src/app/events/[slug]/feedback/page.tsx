'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { PublicFeedback, FeedbackSummary, FeedbackPublicationConsent } from '@connect/types';
import { normalizeApiUrl } from '@connect/config';

export default function EventFeedbackPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [eventData, setEventData] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [publicFeedbacks, setPublicFeedbacks] = useState<PublicFeedback[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Form submission state
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [consent, setConsent] = useState<FeedbackPublicationConsent>('ANONYMOUS');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

      // 1. Fetch event
      const evRes = await fetch(`${apiUrl}/v1/events/${slug}`);
      if (evRes.ok) {
        const evJson = await evRes.json();
        const ev = evJson.data;
        setEventData(ev);

        // 2. Fetch public feedback
        const fbRes = await fetch(`${apiUrl}/v1/events/${ev.id}/feedback`);
        if (fbRes.ok) {
          const fbJson = await fbRes.json();
          setPublicFeedbacks(fbJson.data || []);
        }

        // 3. Fetch summary metrics
        const sumRes = await fetch(`${apiUrl}/v1/events/${ev.id}/feedback/summary`);
        if (sumRes.ok) {
          const sumJson = await sumRes.json();
          setSummary(sumJson.data);
        }
      }
    } catch {
      // Offline fallback
      setEventData({
        id: '00000000-0000-0000-0000-000000000101',
        title: 'Aptify 2.0: AI Symposium',
        slug: 'aptify-2026',
      });
      setPublicFeedbacks([
        {
          id: '00000000-0000-0000-0000-000000000901',
          event_id: '00000000-0000-0000-0000-000000000101',
          rating: 5,
          feedback_text: 'The computer vision hands-on session was exceptionally structured and practical!',
          suggestion_text: 'Would love an advanced multi-modal agent track in the next workshop.',
          author_name: 'Aarav Sharma',
          is_anonymous: false,
          created_at: '2026-03-01T17:00:00Z',
        },
      ]);
      setSummary({
        event_id: '00000000-0000-0000-0000-000000000101',
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
    if (slug) {
      loadData();
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventData) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const res = await fetch(`${apiUrl}/v1/events/${eventData.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-student-token',
        },
        body: JSON.stringify({
          rating,
          feedback_text: feedbackText.trim() || undefined,
          suggestion_text: suggestionText.trim() || undefined,
          publication_consent: consent,
          source: 'PORTAL',
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setFeedbackText('');
        setSuggestionText('');
        loadData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error?.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      setErrorMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href={`/events/${slug}`}
          style={{
            color: '#014B7A',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Event Details
        </Link>
      </div>

      {/* Header */}
      <div style={{
        borderBottom: '2px solid #E2E8F0',
        paddingBottom: '24px',
        marginBottom: '36px',
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: '#014B7A12',
          color: '#014B7A',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Event Feedback & Evaluation
        </div>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: 800,
          color: '#0F172A',
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
        }}>
          {eventData ? eventData.title : 'Event Feedback'}
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#475569',
          margin: 0,
          lineHeight: '1.5',
        }}>
          Share your participant experience, rate workshop sessions, and provide feedback to help the AIML Club improve future events.
        </p>
      </div>

      {/* Metric Cards if available */}
      {summary && summary.total_feedback > 0 && (
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Attendee Satisfaction Rating
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              ★ {summary.average_rating.toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748B' }}>/ 5.0</span>
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#475569' }}>
            Based on <strong>{summary.total_feedback}</strong> verified attendee reviews
          </div>
        </div>
      )}

      {/* Feedback Submission Form */}
      <section style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        padding: '30px',
        marginBottom: '48px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>
          Submit Your Feedback
        </h2>

        {submitSuccess ? (
          <div style={{
            backgroundColor: '#00763C15',
            border: '1px solid #00763C',
            color: '#00763C',
            padding: '16px 20px',
            borderRadius: '6px',
            fontSize: '0.95rem',
            lineHeight: '1.5',
          }}>
            <strong>Thank you!</strong> Your feedback has been securely submitted. Our team reviews all suggestions to continuously enhance AIML Club events.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {errorMessage && (
              <div style={{
                backgroundColor: '#EF444415',
                border: '1px solid #EF4444',
                color: '#B91C1C',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}>
                {errorMessage}
              </div>
            )}

            {/* Star Rating Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Overall Rating *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      fontSize: '1.8rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? '#F59E0B' : '#CBD5E1',
                      padding: '4px',
                      transition: 'transform 0.1s ease',
                      minWidth: '44px',
                      minHeight: '44px',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                What did you like about this event?
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="Share your experience regarding speakers, technical depth, workshops, or organization..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#0F172A',
                }}
              />
            </div>

            {/* Suggestions */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Suggestions for Improvement
              </label>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                rows={3}
                placeholder="Topics, pacing, logistics, or equipment you would like to see adjusted..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: '#0F172A',
                }}
              />
            </div>

            {/* Privacy & Attribution Consent */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Public Attribution & Privacy Preference
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="consent"
                    value="ANONYMOUS"
                    checked={consent === 'ANONYMOUS'}
                    onChange={() => setConsent('ANONYMOUS')}
                  />
                  <span>
                    <strong>Publish Anonymously</strong> (Recommended) — Your testimonial may appear publicly as &ldquo;Anonymous Participant&rdquo;.
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="consent"
                    value="PUBLIC_NAME"
                    checked={consent === 'PUBLIC_NAME'}
                    onChange={() => setConsent('PUBLIC_NAME')}
                  />
                  <span>
                    <strong>Publish with Name</strong> — Showcase your testimonial publicly with your name. (Email and phone are NEVER made public).
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="consent"
                    value="NO"
                    checked={consent === 'NO'}
                    onChange={() => setConsent('NO')}
                  />
                  <span>
                    <strong>Private Only</strong> — Internal feedback for event organizers only. Do not publish on the website.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                backgroundColor: '#014B7A',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                minHeight: '44px',
                alignSelf: 'flex-start',
              }}
            >
              {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </section>

      {/* Verified Attendee Testimonials */}
      <section>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', margin: '0 0 16px 0' }}>
          Verified Attendee Testimonials
        </h2>

        {loading ? (
          <div style={{ color: '#64748B' }}>Loading testimonials...</div>
        ) : publicFeedbacks.length === 0 ? (
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '24px',
            color: '#64748B',
            textAlign: 'center',
          }}>
            No public testimonials published for this event yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {publicFeedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: '#F59E0B', fontSize: '1.1rem' }}>
                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                  </span>
                  <time style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {new Date(fb.created_at).toLocaleDateString()}
                  </time>
                </div>

                {fb.feedback_text && (
                  <p style={{ fontSize: '0.95rem', color: '#1E293B', margin: '0 0 8px 0', lineHeight: '1.5' }}>
                    &ldquo;{fb.feedback_text}&rdquo;
                  </p>
                )}

                <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                  — {fb.author_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
