'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface ParticipantItem {
  id: string;
  student_name: string;
  enrollment_number: string;
  email: string;
  phone?: string;
  department: string;
  semester: string;
  team_name?: string;
  registration_source: string;
  registration_status: string;
  registered_at: string;
}

const INITIAL_ROSTER: ParticipantItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000201',
    student_name: 'Aman Sharma',
    enrollment_number: '0126AL221001',
    email: 'aman.sharma@example.com',
    phone: '9876543210',
    department: 'AIML',
    semester: 'VI',
    team_name: 'NeuralNet OCT',
    registration_source: 'MANUAL',
    registration_status: 'CONFIRMED',
    registered_at: '2026-09-10 10:00',
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    student_name: 'Priya Verma',
    enrollment_number: '0126AL221045',
    email: 'priya.verma@example.com',
    phone: '9811223344',
    department: 'AIML',
    semester: 'VI',
    team_name: 'Visionary AI',
    registration_source: 'TALLY',
    registration_status: 'CONFIRMED',
    registered_at: '2026-09-12 14:30',
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    student_name: 'Karan Singh',
    enrollment_number: '0126CS231012',
    email: 'karan.singh@example.com',
    department: 'CSE',
    semester: 'IV',
    registration_source: 'GOOGLE_SHEETS',
    registration_status: 'WAITLISTED',
    registered_at: '2026-09-15 09:15',
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    student_name: 'Anjali Patel',
    enrollment_number: '0126IT221008',
    email: 'anjali.patel@example.com',
    department: 'IT',
    semester: 'VI',
    registration_source: 'WALK_IN',
    registration_status: 'CANCELLED',
    registered_at: '2026-09-08 16:45',
  },
];

export default function EventParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [participants, setParticipants] = useState<ParticipantItem[]>(INITIAL_ROSTER);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.student_name.toLowerCase().includes(search.toLowerCase()) ||
      p.enrollment_number.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.registration_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    setParticipants((prev) =>
      prev.map((item) => (item.id === id ? { ...item, registration_status: newStatus } : item))
    );
  };

  const getStatusBadge = (status: string) => {
    const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
      CONFIRMED: { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
      WAITLISTED: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
      CANCELLED: { bg: '#450A0A', text: '#FCA5A5', border: '#EF4444' },
      ATTENDED: { bg: '#1E3A8A', text: '#93C5FD', border: '#3B82F6' },
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
        <Link
          href={`/events/${resolvedParams.id}`}
          style={{ color: '#38BDF8', fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px' }}
        >
          ← Back to Event Details
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>Participant Roster</h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Confidential student roster. Personal details are protected under institutional privacy standards.
            </p>
          </div>
          <div style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Total Roster: <strong style={{ color: '#F8FAFC' }}>{participants.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
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
            placeholder="Search by student name, enrollment, or email..."
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
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="WAITLISTED">WAITLISTED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="ATTENDED">ATTENDED</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '0.8rem' }}>
              <th style={{ padding: '14px 16px' }}>STUDENT NAME</th>
              <th style={{ padding: '14px 16px' }}>ENROLLMENT</th>
              <th style={{ padding: '14px 16px' }}>CONTACT</th>
              <th style={{ padding: '14px 16px' }}>DEPT & SEM</th>
              <th style={{ padding: '14px 16px' }}>SOURCE</th>
              <th style={{ padding: '14px 16px' }}>STATUS</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
                  No participants found matching the criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1E293B22', color: '#E2E8F0' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{p.student_name}</div>
                    {p.team_name && <div style={{ fontSize: '0.75rem', color: '#A3E635' }}>Team: {p.team_name}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#38BDF8' }}>
                    {p.enrollment_number}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                    <div style={{ color: '#E2E8F0' }}>{p.email}</div>
                    {p.phone && <div style={{ color: '#64748B', fontSize: '0.75rem' }}>{p.phone}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8', fontSize: '0.85rem' }}>
                    {p.department} (Sem {p.semester})
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#64748B' }}>
                    {p.registration_source}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{getStatusBadge(p.registration_status)}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {p.registration_status !== 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'CONFIRMED')}
                          style={{
                            backgroundColor: '#064E3B22',
                            color: '#6EE7B7',
                            border: '1px solid #10B98155',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Confirm
                        </button>
                      )}
                      {p.registration_status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleStatusChange(p.id, 'CANCELLED')}
                          style={{
                            backgroundColor: '#450A0A22',
                            color: '#FCA5A5',
                            border: '1px solid #EF444455',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      )}
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
