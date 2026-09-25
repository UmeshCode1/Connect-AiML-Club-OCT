'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface PublicEvent {
  id: string;
  slug: string;
  event_code: string;
  title: string;
  short_description: string;
  event_type: string;
  status: string;
  venue: string;
  date_str: string;
  is_upcoming: boolean;
  registration_open: boolean;
}

const PUBLIC_EVENTS: PublicEvent[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    slug: 'aptify-2026',
    event_code: 'EVT-APTIFY-2026',
    title: 'Aptify 2.0: AI Symposium & Workshop',
    short_description:
      'Flagship student symposium featuring machine learning keynotes, generative AI workflows, competitive tracks, and verified participation credentials.',
    event_type: 'SYMPOSIUM',
    status: 'REGISTRATION_OPEN',
    venue: 'Auditorium, Oriental College of Technology, Bhopal',
    date_str: 'October 15, 2026 • 09:30 AM – 05:00 PM',
    is_upcoming: true,
    registration_open: true,
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    slug: 'snapcode-2026',
    event_code: 'EVT-SNAPCODE-2026',
    title: 'SNAPCODE: Winter Sprint Competition',
    short_description:
      'High-speed algorithmic problem solving and competitive coding sprint designed to build real-world engineering speed.',
    event_type: 'COMPETITION',
    status: 'PLANNING',
    venue: 'Computer Center, Oriental College of Technology',
    date_str: 'November 20, 2026 • 10:00 AM – 04:00 PM',
    is_upcoming: true,
    registration_open: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000099',
    slug: 'aptify-1-0',
    event_code: 'EVT-APTIFY-2025',
    title: 'Aptify 1.0: Foundation in Machine Learning',
    short_description:
      'Introductory workshop series on classical machine learning, feature engineering, and neural network foundations.',
    event_type: 'WORKSHOP',
    status: 'COMPLETED',
    venue: 'Seminar Hall 1, OCT Bhopal',
    date_str: 'March 18, 2025',
    is_upcoming: false,
    registration_open: false,
  },
];

export default function EventsIndexPage() {
  const [tab, setTab] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = PUBLIC_EVENTS.filter((evt) => {
    const matchesTab =
      tab === 'ALL' ||
      (tab === 'UPCOMING' && evt.is_upcoming) ||
      (tab === 'PAST' && !evt.is_upcoming);

    const matchesSearch =
      evt.title.toLowerCase().includes(search.toLowerCase()) ||
      evt.short_description.toLowerCase().includes(search.toLowerCase()) ||
      evt.venue.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-brand-secondary, #00763C)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            AIML CLUB OCT • CALENDAR & ROSTER
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-brand-primary, #014B7A)', marginTop: '4px' }}>
            Events & Activities
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary, #5B6573)', marginTop: '6px', maxWidth: '640px' }}>
            Explore technical symposiums, hackathons, and hands-on AI workshops organized by the AI & Machine Learning Club, Oriental College of Technology.
          </p>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'UPCOMING', 'PAST'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: tab === t ? 700 : 500,
                backgroundColor: tab === t ? 'var(--color-brand-primary, #014B7A)' : '#F1F5F9',
                color: tab === t ? '#FFFFFF' : '#475569',
                border: '1px solid transparent',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              {t === 'ALL' ? 'All Events' : t === 'UPCOMING' ? 'Upcoming' : 'Past Events'}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search events by title or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontSize: '0.9rem',
              minHeight: '44px',
            }}
          />
        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filtered.length === 0 ? (
          <Card>
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
              No events found matching your selected criteria.
            </div>
          </Card>
        ) : (
          filtered.map((evt) => (
            <Card key={evt.id} elevated={evt.registration_open}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusPill
                      label={evt.registration_open ? 'Registration Open' : evt.status}
                      variant={evt.registration_open ? 'success' : 'neutral'}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-brand-primary, #014B7A)' }}>
                      {evt.event_type}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>• {evt.event_code}</span>
                  </div>
                </div>

                <div>
                  <Link href={`/events/${evt.slug}`} style={{ textDecoration: 'none' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                      {evt.title}
                    </h2>
                  </Link>
                  <p style={{ fontSize: '0.925rem', color: '#4B5563', marginTop: '6px', lineHeight: 1.5 }}>
                    {evt.short_description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748B' }}>
                    <div>📅 {evt.date_str}</div>
                    <div>📍 {evt.venue}</div>
                  </div>

                  <Link href={`/events/${evt.slug}`} style={{ textDecoration: 'none' }}>
                    <Button variant={evt.registration_open ? 'primary' : 'outline'} size="sm">
                      {evt.registration_open ? 'Register Now →' : 'View Event Details →'}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
