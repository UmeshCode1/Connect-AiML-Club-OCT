'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';

interface AttendeeRecord {
  id: string;
  student_name: string;
  enrollment_number: string;
  check_in_at: string;
  check_out_at?: string;
  status: 'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT';
  source: 'QR' | 'MANUAL';
  corrected_by?: string;
  correction_reason?: string;
}

const INITIAL_ATTENDANCE: AttendeeRecord[] = [
  {
    id: 'att-01',
    student_name: 'Aman Sharma',
    enrollment_number: '0126AL221001',
    check_in_at: '09:28 AM',
    check_out_at: undefined,
    status: 'PRESENT',
    source: 'QR',
  },
  {
    id: 'att-02',
    student_name: 'Priya Verma',
    enrollment_number: '0126AL221045',
    check_in_at: '09:32 AM',
    check_out_at: undefined,
    status: 'PRESENT',
    source: 'QR',
  },
  {
    id: 'att-03',
    student_name: 'Rohit Khandelwal',
    enrollment_number: '0126CS231088',
    check_in_at: '09:55 AM',
    check_out_at: undefined,
    status: 'LATE',
    source: 'MANUAL',
    correction_reason: 'Joined after lab permission delay',
  },
];

export default function SessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const resolvedParams = use(params);
  const [records, setRecords] = useState<AttendeeRecord[]>(INITIAL_ATTENDANCE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Scanner UI State
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'SUCCESS' | 'DUPLICATE' | 'INVALID';
    message: string;
  } | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState<AttendeeRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT'>('EXCUSED');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const totalRegistered = 250;
  const totalPresent = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendancePercentage = Math.round((totalPresent / totalRegistered) * 100);

  // Simulated Scan / Manual Check-In
  const handleCheckIn = (enrollment: string) => {
    const norm = enrollment.trim().toUpperCase();
    if (!norm) return;

    // Check duplicate
    const existing = records.find((r) => r.enrollment_number === norm);
    if (existing) {
      setScanResult({
        type: 'DUPLICATE',
        message: `Student ${existing.student_name} (${norm}) is ALREADY CHECKED IN at ${existing.check_in_at}.`,
      });
      return;
    }

    // Add record
    const newRecord: AttendeeRecord = {
      id: `att-${Date.now()}`,
      student_name: `Student (${norm})`,
      enrollment_number: norm,
      check_in_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'PRESENT',
      source: scannerActive ? 'QR' : 'MANUAL',
    };

    setRecords((prev) => [newRecord, ...prev]);
    setScanResult({
      type: 'SUCCESS',
      message: `Verified & Checked In: ${norm} at ${newRecord.check_in_at}`,
    });
    setManualInput('');
  };

  const handleExecuteCorrection = () => {
    setCorrectionError(null);
    if (correctionReason.trim().length < 4) {
      setCorrectionError('A mandatory explanatory reason (min 4 chars) is required for audit logs.');
      return;
    }

    if (!correctingRecord) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === correctingRecord.id
          ? {
              ...r,
              status: correctionStatus,
              corrected_by: 'Staff Administrator',
              correction_reason: correctionReason.trim(),
            }
          : r
      )
    );

    setCorrectingRecord(null);
    setCorrectionReason('');
  };

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.enrollment_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      PRESENT: { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
      LATE: { bg: '#78350F', text: '#FDE68A', border: '#D97706' },
      EXCUSED: { bg: '#1E3A8A', text: '#93C5FD', border: '#3B82F6' },
      ABSENT: { bg: '#450A0A', text: '#FCA5A5', border: '#EF4444' },
    };
    const c = colors[status] || { bg: '#334155', text: '#CBD5E1', border: '#475569' };
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
          href={`/events/${resolvedParams.id}/sessions`}
          style={{ color: '#38BDF8', fontSize: '0.85rem', display: 'inline-block', marginBottom: '8px' }}
        >
          ← Back to Sessions
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>
              Live Attendance & Check-In Checkpoint
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Session SES-APT-01 • Authoritative server verification • Replay-safe QR scanning.
            </p>
          </div>
          <button
            onClick={() => setScannerActive((prev) => !prev)}
            style={{
              backgroundColor: scannerActive ? '#EF4444' : '#014B7A',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            {scannerActive ? '✕ Close QR Scanner' : '📷 Open Mobile QR Scanner'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL PRESENT</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{totalPresent}</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>EXPECTED REGISTERED</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', marginTop: '4px' }}>{totalRegistered}</div>
        </div>
        <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600 }}>ATTENDANCE RATE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38BDF8', marginTop: '4px' }}>
            {attendancePercentage}%
          </div>
        </div>
      </div>

      {/* Scanner & Manual Check-In Interface */}
      <div
        style={{
          backgroundColor: '#111820',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '12px' }}>
          Check-In Input Interface
        </h2>

        {scannerActive && (
          <div
            style={{
              padding: '24px',
              backgroundColor: '#0B0F14',
              borderRadius: '8px',
              border: '2px dashed #38BDF8',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📷</div>
            <div style={{ fontWeight: 600, color: '#F8FAFC', marginBottom: '4px' }}>
              QR Scanner Camera Viewport Active
            </div>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px' }}>
              Point camera at student QR attendance pass. Backend cryptographically validates HMAC signature and expiration.
            </p>
          </div>
        )}

        {/* Scan / Verification Notification */}
        {scanResult && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '0.9rem',
              fontWeight: 600,
              backgroundColor:
                scanResult.type === 'SUCCESS' ? '#064E3B' : scanResult.type === 'DUPLICATE' ? '#78350F' : '#450A0A',
              color:
                scanResult.type === 'SUCCESS' ? '#6EE7B7' : scanResult.type === 'DUPLICATE' ? '#FDE68A' : '#FCA5A5',
              border: `1px solid ${
                scanResult.type === 'SUCCESS' ? '#10B981' : scanResult.type === 'DUPLICATE' ? '#D97706' : '#EF4444'
              }`,
            }}
          >
            {scanResult.type === 'SUCCESS' ? '✓ ' : '⚠ '}
            {scanResult.message}
          </div>
        )}

        {/* Manual Fallback Input */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Type Enrollment Number (e.g. 0126AL221001)..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              minHeight: '44px',
            }}
          />
          <button
            onClick={() => handleCheckIn(manualInput)}
            style={{
              backgroundColor: '#00763C',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Check In Student
          </button>
        </div>
      </div>

      {/* Filter and Attendance Roster Table */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          backgroundColor: '#111820',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid #1E293B',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search attendee by name or enrollment number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
            }}
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#0B0F14',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="EXCUSED">EXCUSED</option>
            <option value="ABSENT">ABSENT</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#111820', border: '1px solid #1E293B', borderRadius: '8px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#94A3B8', fontSize: '0.8rem' }}>
              <th style={{ padding: '12px 16px' }}>STUDENT NAME</th>
              <th style={{ padding: '12px 16px' }}>ENROLLMENT</th>
              <th style={{ padding: '12px 16px' }}>CHECK-IN</th>
              <th style={{ padding: '12px 16px' }}>METHOD</th>
              <th style={{ padding: '12px 16px' }}>STATUS</th>
              <th style={{ padding: '12px 16px' }}>AUDIT NOTE</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                  No attendance records found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1E293B22', color: '#E2E8F0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#F8FAFC' }}>{r.student_name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#38BDF8' }}>
                    {r.enrollment_number}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{r.check_in_at}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#94A3B8' }}>{r.source}</td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(r.status)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: '#64748B' }}>
                    {r.correction_reason || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setCorrectingRecord(r);
                        setCorrectionStatus(r.status);
                        setCorrectionReason(r.correction_reason || '');
                        setCorrectionError(null);
                      }}
                      style={{
                        backgroundColor: '#1E293B',
                        color: '#38BDF8',
                        border: '1px solid #334155',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Correct Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Correction Modal */}
      {correctingRecord && (
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
              Manual Attendance Correction
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '16px' }}>
              Correcting attendance for{' '}
              <strong>{correctingRecord.student_name}</strong> ({correctingRecord.enrollment_number}).
            </p>

            {correctionError && (
              <div
                style={{
                  backgroundColor: '#450A0A',
                  border: '1px solid #DC2626',
                  color: '#FCA5A5',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '14px',
                }}
              >
                {correctionError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                New Attendance Status
              </label>
              <select
                value={correctionStatus}
                onChange={(e) => setCorrectionStatus(e.target.value as any)}
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
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                Explanatory Reason * (Mandatory for Audit Trail)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Student lab pass verified by instructor Dr. Sharma"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0B0F14',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCorrectingRecord(null)}
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
                type="button"
                onClick={handleExecuteCorrection}
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
                Commit Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
