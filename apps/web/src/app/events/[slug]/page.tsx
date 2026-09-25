'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface EventData {
  slug: string;
  event_code: string;
  title: string;
  short_description: string;
  description: string;
  event_type: string;
  status: string;
  venue: string;
  start_at: string;
  end_at: string;
  registration_open: boolean;
  capacity: number;
}

const EVENT_REGISTRY: Record<string, EventData> = {
  'aptify-2026': {
    slug: 'aptify-2026',
    event_code: 'EVT-APTIFY-2026',
    title: 'Aptify 2.0: AI Symposium & Workshop',
    short_description: 'Flagship AI symposium and workshop at Oriental College of Technology.',
    description:
      'Join us for the second edition of Aptify, the flagship artificial intelligence and machine learning conference organized by AIML Club OCT. The symposium features industry keynote speakers, deep learning technical workshops, code challenge sprint tracks, and verified digital credentials for all active participants.',
    event_type: 'SYMPOSIUM',
    status: 'REGISTRATION_OPEN',
    venue: 'Auditorium, Oriental College of Technology, Bhopal',
    start_at: 'October 15, 2026 • 09:30 AM',
    end_at: 'October 15, 2026 • 05:00 PM',
    registration_open: true,
    capacity: 250,
  },
  'snapcode-2026': {
    slug: 'snapcode-2026',
    event_code: 'EVT-SNAPCODE-2026',
    title: 'SNAPCODE: Winter Sprint Competition',
    short_description: 'High-intensity competitive programming sprint.',
    description:
      'SNAPCODE is the club’s signature timed competitive programming challenge. Students solve algorithmic challenges across discrete mathematics, graph traversal, and dynamic programming.',
    event_type: 'COMPETITION',
    status: 'PLANNING',
    venue: 'Computer Center, Oriental College of Technology, Bhopal',
    start_at: 'November 20, 2026 • 10:00 AM',
    end_at: 'November 20, 2026 • 04:00 PM',
    registration_open: false,
    capacity: 80,
  },
};

export default function PublicEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const event = EVENT_REGISTRY[resolvedParams.slug] || EVENT_REGISTRY['aptify-2026'];

  // Registration state
  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNumber: '',
    email: '',
    phone: '',
    department: 'AIML',
    semester: 'VI',
    teamName: '',
  });

  const [registrationResult, setRegistrationResult] = useState<{
    status: 'CONFIRMED' | 'WAITLISTED';
    message: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const cleanEnrollment = formData.enrollmentNumber.trim().toUpperCase();
    if (cleanEnrollment.length < 5) {
      setError('Please provide a valid institutional enrollment number (e.g. 0126AL221001).');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setRegistrationResult({
        status: 'CONFIRMED',
        message: `Registration confirmed for ${formData.fullName.trim()} (${cleanEnrollment}). An email notification with event details and entry pass has been scheduled.`,
      });
    }, 500);
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Navigation */}
      <div>
        <Link href="/events" style={{ color: 'var(--color-brand-primary, #014B7A)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to All Events
        </Link>
      </div>

      {/* Main Event Showcase Banner */}
      <Card elevated>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <StatusPill
              label={event.registration_open ? 'Registration Open' : event.status}
              variant={event.registration_open ? 'success' : 'neutral'}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-brand-primary, #014B7A)' }}>
              {event.event_type}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>• {event.event_code}</span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-brand-primary, #014B7A)', lineHeight: 1.2 }}>
            {event.title}
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.6 }}>
            {event.description}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              marginTop: '8px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>WHEN</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{event.start_at}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>WHERE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{event.venue}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>CAPACITY</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{event.capacity} Seats</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Registration Section */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B' }}>
              Student Registration Portal
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '4px' }}>
              Open to students of Oriental College of Technology (OCT) and affiliated institutions.
              Already registered?{' '}
              <Link href={`/events/${event.slug}/pass`} style={{ color: 'var(--color-brand-primary, #014B7A)', fontWeight: 600, textDecoration: 'underline' }}>
                Access your Digital Attendance Pass →
              </Link>
            </p>
          </div>

          {!event.registration_open ? (
            <div style={{ padding: '24px', backgroundColor: '#F1F5F9', borderRadius: '8px', textAlign: 'center', color: '#475569' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Registration is currently not open for this event.</div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                Follow official AIML Club OCT announcements for updates.
              </p>
            </div>
          ) : registrationResult ? (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #10B981',
                borderRadius: '8px',
                padding: '24px',
                color: '#065F46',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                ✓ Registration Successful
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{registrationResult.message}</p>
              <div style={{ marginTop: '16px' }}>
                <Link
                  href={`/events/${event.slug}/pass`}
                  style={{
                    display: 'inline-block',
                    backgroundColor: 'var(--color-brand-primary, #014B7A)',
                    color: 'white',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  View Digital Attendance Pass →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px', borderRadius: '6px', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Full Student Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Aman Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    College Enrollment Number *
                  </label>
                  <input
                    type="text"
                    name="enrollmentNumber"
                    required
                    placeholder="e.g. 0126AL221001"
                    value={formData.enrollmentNumber}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Student Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. aman.sharma@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    WhatsApp / Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  >
                    <option value="AIML">AI & Machine Learning (AIML)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="AIDS">AI & Data Science (AIDS)</option>
                    <option value="OTHER">Other Engineering Branch</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  >
                    <option value="II">Semester II</option>
                    <option value="IV">Semester IV</option>
                    <option value="VI">Semester VI</option>
                    <option value="VIII">Semester VIII</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Team / Project Name (optional)
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    placeholder="e.g. NeuralNet OCT"
                    value={formData.teamName}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.9rem', minHeight: '44px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button variant="primary" size="lg" type="submit" isLoading={isSubmitting}>
                  Confirm Event Registration
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
