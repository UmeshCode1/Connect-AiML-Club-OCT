'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button, EmptyState } from '@connect/ui';

export interface EventItem {
  id: string;
  slug: string;
  event_code: string;
  title: string;
  short_description?: string;
  description?: string;
  event_type: string;
  status: string;
  visibility: string;
  venue?: string;
  start_at: string;
  end_at: string;
  registration_open_at?: string;
  registration_close_at?: string;
  capacity?: number;
}

interface EventsClientProps {
  initialEvents: EventItem[];
}

export default function EventsClient({ initialEvents }: EventsClientProps) {
  const [tab, setTab] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED'>('ALL');
  const [search, setSearch] = useState('');

  const now = new Date();

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((evt) => {
      const startDate = evt.start_at ? new Date(evt.start_at) : null;
      const endDate = evt.end_at ? new Date(evt.end_at) : null;

      const isLive = evt.status === 'LIVE' || (startDate && endDate && now >= startDate && now <= endDate);
      const isUpcoming = evt.status === 'REGISTRATION_OPEN' || evt.status === 'UPCOMING' || (startDate && startDate > now && !isLive);
      const isCompleted = evt.status === 'COMPLETED' || evt.status === 'ARCHIVED' || (endDate && endDate < now && !isLive);

      if (tab === 'UPCOMING' && !isUpcoming) return false;
      if (tab === 'LIVE' && !isLive) return false;
      if (tab === 'COMPLETED' && !isCompleted) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = evt.title?.toLowerCase().includes(q);
        const matchesDesc = evt.short_description?.toLowerCase().includes(q);
        const matchesVenue = evt.venue?.toLowerCase().includes(q);
        const matchesCode = evt.event_code?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesVenue && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [initialEvents, tab, search, now]);

  const formatEventDate = (startStr: string, endStr?: string) => {
    try {
      const s = new Date(startStr);
      const formattedStart = s.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      if (!endStr) return formattedStart;
      const e = new Date(endStr);
      const formattedEnd = e.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return `${formattedStart} – ${formattedEnd}`;
    } catch {
      return startStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Editorial Header */}
      <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#00763C',
              backgroundColor: '#ECFDF5',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            Official Calendar &amp; Symposiums
          </span>
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>AIML CLUB OCT</span>
        </div>
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: '#0B0F14',
            letterSpacing: '-0.02em',
            margin: '0 0 8px 0',
          }}
        >
          Events &amp; Symposiums
        </h1>
        <p style={{ fontSize: '1rem', color: '#475569', maxWidth: '680px', margin: 0, lineHeight: 1.6 }}>
          Explore technical symposiums, hackathons, and hands-on AI workshops organized by the AI &amp; Machine Learning
          Club at Oriental College of Technology, Bhopal.
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: tab === t ? 700 : 500,
                backgroundColor: tab === t ? '#014B7A' : '#F1F5F9',
                color: tab === t ? '#FFFFFF' : '#475569',
                border: '1px solid transparent',
                cursor: 'pointer',
                minHeight: '44px',
                transition: 'all 150ms ease',
              }}
            >
              {t === 'ALL' ? 'All Events' : t === 'UPCOMING' ? 'Upcoming' : t === 'LIVE' ? 'Live Now' : 'Past Events'}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}>
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
              backgroundColor: '#FFFFFF',
            }}
          />
        </div>
      </div>

      {/* Events Stream */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description={
            initialEvents.length === 0
              ? 'No upcoming events scheduled at this time. Check back soon for symposiums, workshops, and hackathons.'
              : 'No events match your selected filters. Try another tab or search keyword.'
          }
          actionText={initialEvents.length > 0 ? 'Clear Search' : undefined}
          onAction={initialEvents.length > 0 ? () => { setSearch(''); setTab('ALL'); } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredEvents.map((evt) => {
            const isRegOpen = evt.status === 'REGISTRATION_OPEN';
            return (
              <Card key={evt.id} elevated={isRegOpen}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={evt.status} />
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#014B7A',
                          backgroundColor: '#E0F2FE',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {evt.event_type}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>• {evt.event_code}</span>
                    </div>

                    {evt.capacity && (
                      <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        Capacity: <strong>{evt.capacity}</strong> attendees
                      </span>
                    )}
                  </div>

                  <div>
                    <Link href={`/events/${evt.slug}`} style={{ textDecoration: 'none' }}>
                      <h2
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 700,
                          color: '#1E293B',
                          margin: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {evt.title}
                      </h2>
                    </Link>
                    {evt.short_description && (
                      <p style={{ fontSize: '0.925rem', color: '#4B5563', marginTop: '6px', lineHeight: 1.5 }}>
                        {evt.short_description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap',
                        fontSize: '0.85rem',
                        color: '#64748B',
                      }}
                    >
                      {evt.start_at && <div>📅 {formatEventDate(evt.start_at, evt.end_at)}</div>}
                      {evt.venue && <div>📍 {evt.venue}</div>}
                    </div>

                    <Link href={`/events/${evt.slug}`} style={{ textDecoration: 'none' }}>
                      <Button variant={isRegOpen ? 'primary' : 'outline'} size="sm">
                        {isRegOpen ? 'Register Now →' : 'View Event Details →'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
