'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface VolunteerItem {
  id: string;
  student_name: string;
  enrollment_number: string;
  role: 'ATTENDANCE' | 'REGISTRATION_DESK' | 'SESSION_SUPPORT' | 'MEDIA' | 'GENERAL_OPERATIONS';
  status: 'ASSIGNED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

const INITIAL_VOLUNTEERS: VolunteerItem[] = [
  {
    id: 'vol-01',
    student_name: 'Rohan Deshmukh',
    enrollment_number: '0126AL221050',
    role: 'ATTENDANCE',
    status: 'ASSIGNED',
    created_at: '2026-09-25',
  },
  {
    id: 'vol-02',
    student_name: 'Kavita Joshi',
    enrollment_number: '0126CS231044',
    role: 'REGISTRATION_DESK',
    status: 'ASSIGNED',
    created_at: '2026-09-25',
  },
  {
    id: 'vol-03',
    student_name: 'Nitin Pandey',
    enrollment_number: '0126IT221019',
    role: 'SESSION_SUPPORT',
    status: 'ASSIGNED',
    created_at: '2026-09-25',
  },
];

export default function EventVolunteersPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>(INITIAL_VOLUNTEERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [role, setRole] = useState<'ATTENDANCE' | 'REGISTRATION_DESK' | 'SESSION_SUPPORT' | 'MEDIA' | 'GENERAL_OPERATIONS'>('ATTENDANCE');

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment.trim()) return;

    const newVolunteer: VolunteerItem = {
      id: `vol-${Date.now()}`,
      student_name: name.trim() || `Volunteer (${enrollment.trim().toUpperCase()})`,
      enrollment_number: enrollment.trim().toUpperCase(),
      role: role,
      status: 'ASSIGNED',
      created_at: new Date().toISOString().slice(0, 10),
    };

    setVolunteers((prev) => [...prev, newVolunteer]);
    setName('');
    setEnrollment('');
    setIsModalOpen(false);
  };

  const handleRemove = (id: string) => {
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>
              Event Volunteer Team & Assignments
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Assign student volunteers to operational roles under least-privilege RBAC.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            + Assign Volunteer
          </button>
        </div>
      </div>

      {/* Security Scope Notice */}
      <div
        style={{
          backgroundColor: '#0F172A',
          border: '1px solid #1E3A8A',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          fontSize: '0.85rem',
          color: '#93C5FD',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>🛡️</span>
        <div>
          <strong>Least-Privilege Enforcement:</strong> Volunteers assigned to <code>ATTENDANCE</code> receive operational scanning and roster inspection access restricted strictly to this event. They cannot publish events, edit metadata, issue certificates, or access unrelated platform modules.
        </div>
      </div>

      {/* Volunteer List */}
      <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '0.8rem' }}>
              <th style={{ padding: '14px 16px' }}>STUDENT NAME</th>
              <th style={{ padding: '14px 16px' }}>ENROLLMENT NUMBER</th>
              <th style={{ padding: '14px 16px' }}>OPERATIONAL ROLE</th>
              <th style={{ padding: '14px 16px' }}>STATUS</th>
              <th style={{ padding: '14px 16px' }}>ASSIGNED DATE</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                  No volunteers currently assigned to this event.
                </td>
              </tr>
            ) : (
              volunteers.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid #1E293B22', color: '#E2E8F0' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#F8FAFC' }}>{v.student_name}</td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#38BDF8' }}>
                    {v.enrollment_number}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        backgroundColor: '#014B7A22',
                        color: '#38BDF8',
                        border: '1px solid #014B7A55',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {v.role}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        backgroundColor: '#064E3B',
                        color: '#6EE7B7',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{v.created_at}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemove(v.id)}
                      style={{
                        backgroundColor: '#450A0A',
                        color: '#FCA5A5',
                        border: '1px solid #EF444455',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '16px' }}>
              Assign Event Volunteer
            </h3>
            <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  Student Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikas Tiwari"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  College Enrollment Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0126AL221050"
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>
                  Operational Responsibility
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0B0F14',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#F8FAFC',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="ATTENDANCE">ATTENDANCE (QR Scanning & Checkpoint)</option>
                  <option value="REGISTRATION_DESK">REGISTRATION_DESK (Intake & Helpdesk)</option>
                  <option value="SESSION_SUPPORT">SESSION_SUPPORT (Audio/Visual & Lab)</option>
                  <option value="MEDIA">MEDIA (Photography & Coverage)</option>
                  <option value="GENERAL_OPERATIONS">GENERAL_OPERATIONS</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    backgroundColor: '#1E293B',
                    color: '#CBD5E1',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    backgroundColor: '#014B7A',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
