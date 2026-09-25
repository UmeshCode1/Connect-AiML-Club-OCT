'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateEventPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    event_code: '',
    short_description: '',
    description: '',
    event_type: 'WORKSHOP',
    venue: 'Auditorium, Oriental College of Technology, Bhopal',
    capacity: 100,
    start_at: '',
    end_at: '',
    registration_open_at: '',
    registration_close_at: '',
    visibility: 'PUBLIC',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validations
    if (!formData.title.trim()) {
      setError('Event title is required.');
      return;
    }

    if (formData.start_at && formData.end_at && formData.start_at > formData.end_at) {
      setError('Event start date cannot be after end date.');
      return;
    }

    if (formData.registration_open_at && formData.registration_close_at && formData.registration_open_at > formData.registration_close_at) {
      setError('Registration opening date cannot be after closing date.');
      return;
    }

    setIsSubmitting(true);

    // Mock API call or real dispatch; then redirect to events list
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/events');
    }, 600);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/events" style={{ color: '#38BDF8', fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px' }}>
          ← Back to Events List
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Create New Event</h1>
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
          New events are created in DRAFT state. You can schedule and configure them before publishing.
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#450A0A',
            border: '1px solid #DC2626',
            color: '#FCA5A5',
            padding: '14px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#111820',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Aptify 3.0: National AI Conclave"
            value={formData.title}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.95rem',
            }}
          />
        </div>

        {/* Slug and Event Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Custom Slug (optional)
            </label>
            <input
              type="text"
              name="slug"
              placeholder="aptify-conclave-2026"
              value={formData.slug}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Event Code (optional)
            </label>
            <input
              type="text"
              name="event_code"
              placeholder="EVT-APTIFY-2026"
              value={formData.event_code}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
            Short Summary / Tagline
          </label>
          <input
            type="text"
            name="short_description"
            placeholder="Brief overview displayed on preview cards..."
            value={formData.short_description}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Full Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
            Full Event Description
          </label>
          <textarea
            name="description"
            rows={4}
            placeholder="Detailed overview, agenda, target audience, prerequisites..."
            value={formData.description}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Event Type, Venue, Capacity, Visibility */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Event Type
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            >
              <option value="WORKSHOP">WORKSHOP</option>
              <option value="HACKATHON">HACKATHON</option>
              <option value="BOOTCAMP">BOOTCAMP</option>
              <option value="SEMINAR">SEMINAR</option>
              <option value="COMPETITION">COMPETITION</option>
              <option value="CONFERENCE">CONFERENCE</option>
              <option value="MEETUP">MEETUP</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Seat Capacity
            </label>
            <input
              type="number"
              name="capacity"
              min={1}
              value={formData.capacity}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
            Venue / Hall Location
          </label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
            }}
          />
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Event Start Date
            </label>
            <input
              type="date"
              name="start_at"
              value={formData.start_at}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
              Event End Date
            </label>
            <input
              type="date"
              name="end_at"
              value={formData.end_at}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#0B0F14',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '0.9rem',
              }}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <Link
            href="/events"
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              color: '#94A3B8',
              backgroundColor: '#1E293B',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 24px',
              borderRadius: '6px',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              minHeight: '44px',
            }}
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event (Draft)'}
          </button>
        </div>
      </form>
    </div>
  );
}
