'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface EventItem {
  id: string;
  event_code: string;
  slug: string;
  title: string;
  short_description: string;
  event_type: string;
  status: string;
  visibility: string;
  venue: string;
  capacity: number;
  registered_count: number;
  start_at: string;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    event_code: 'EVT-APTIFY-2026',
    slug: 'aptify-2026',
    title: 'Aptify 2.0: AI Symposium',
    short_description: 'Flagship AI symposium and workshop at Oriental College of Technology.',
    event_type: 'SYMPOSIUM',
    status: 'REGISTRATION_OPEN',
    visibility: 'PUBLIC',
    venue: 'Auditorium, OCT Bhopal',
    capacity: 250,
    registered_count: 142,
    start_at: '2026-10-15',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    event_code: 'EVT-SNAPCODE-2026',
    slug: 'snapcode-2026',
    title: 'SNAPCODE: Winter Sprint',
    short_description: 'High-intensity competitive programming sprint.',
    event_type: 'COMPETITION',
    status: 'PLANNING',
    visibility: 'PUBLIC',
    venue: 'Computer Center, OCT',
    capacity: 80,
    registered_count: 0,
    start_at: '2026-11-20',
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    event_code: 'EVT-DL-WORKSHOP',
    slug: 'dl-workshop-2026',
    title: 'Deep Learning Foundation Hands-on',
    short_description: 'PyTorch neural networks implementation session.',
    event_type: 'WORKSHOP',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    venue: 'Lab 4, AIML Department',
    capacity: 50,
    registered_count: 0,
    start_at: '2026-12-05',
  },
];

export default function AdminEventsPage() {
  const [events] = useState<EventItem[]>(INITIAL_EVENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(search.toLowerCase()) ||
      evt.event_code.toLowerCase().includes(search.toLowerCase()) ||
      evt.venue.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
      DRAFT: { bg: '#334155', text: '#CBD5E1', border: '#475569' },
      PLANNING: { bg: '#1E3A8A', text: '#93C5FD', border: '#3B82F6' },
      REGISTRATION_OPEN: { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
      REGISTRATION_CLOSED: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
      LIVE: { bg: '#831843', text: '#F472B6', border: '#EC4899' },
      COMPLETED: { bg: '#14532D', text: '#86EFAC', border: '#22C55E' },
      ARCHIVED: { bg: '#18181B', text: '#71717A', border: '#27272A' },
    };
    const c = badgeColors[status] || badgeColors.DRAFT;
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
      {/* Header and CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Event Management</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
            Coordinate event lifecycles, registrations, capacities, and participant rosters.
          </p>
        </div>
        <Link
          href="/events/new"
          style={{
            backgroundColor: '#014B7A',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
          }}
        >
          <span>+ Create New Event</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL EVENTS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>{events.length}</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>REGISTRATION OPEN</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
            {events.filter((e) => e.status === 'REGISTRATION_OPEN').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>IN PLANNING / DRAFT</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            {events.filter((e) => e.status === 'PLANNING' || e.status === 'DRAFT').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE PARTICIPANTS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#A3E635', marginTop: '4px' }}>
            {events.reduce((sum, e) => sum + e.registered_count, 0)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          backgroundColor: '#111820',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #1E293B',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by title, event code, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              minHeight: '44px',
            }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              minHeight: '44px',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PLANNING">PLANNING</option>
            <option value="REGISTRATION_OPEN">REGISTRATION_OPEN</option>
            <option value="REGISTRATION_CLOSED">REGISTRATION_CLOSED</option>
            <option value="LIVE">LIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '0.8rem' }}>
              <th style={{ padding: '14px 16px' }}>CODE</th>
              <th style={{ padding: '14px 16px' }}>TITLE & VENUE</th>
              <th style={{ padding: '14px 16px' }}>TYPE</th>
              <th style={{ padding: '14px 16px' }}>STATUS</th>
              <th style={{ padding: '14px 16px' }}>CAPACITY</th>
              <th style={{ padding: '14px 16px' }}>DATE</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                  No events found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} style={{ borderBottom: '1px solid #1E293B22', color: '#E2E8F0' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38BDF8' }}>
                    {evt.event_code}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{evt.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{evt.venue}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{evt.event_type}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{getStatusBadge(evt.status)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#F8FAFC' }}>{evt.registered_count}</span>
                      <span style={{ color: '#64748B' }}> / {evt.capacity}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.85rem' }}>{evt.start_at}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Link
                        href={`/events/${evt.id}`}
                        style={{
                          backgroundColor: '#014B7A22',
                          color: '#38BDF8',
                          border: '1px solid #014B7A55',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/events/${evt.id}/participants`}
                        style={{
                          backgroundColor: '#1E293B',
                          color: '#E2E8F0',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Roster
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
