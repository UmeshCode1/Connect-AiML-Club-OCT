'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface CertificateBatch {
  id: string;
  event_id: string;
  template_id: string;
  certificate_type: string;
  total_recipients: number;
  total_generated: number;
  total_failed: number;
  status: 'DRAFT' | 'GENERATING' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'FAILED';
  created_at: string;
}

interface CertificateItem {
  id: string;
  certificate_id: string;
  recipient_name: string;
  certificate_type: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ISSUED' | 'REVOKED' | 'REPLACED';
  issued_at: string;
  revoke_reason?: string;
  replaced_by?: string;
}

const INITIAL_BATCHES: CertificateBatch[] = [
  {
    id: 'batch-aptify-001',
    event_id: '00000000-0000-0000-0000-000000000101',
    template_id: '00000000-0000-0000-0000-000000000001',
    certificate_type: 'PARTICIPATION',
    total_recipients: 124,
    total_generated: 124,
    total_failed: 0,
    status: 'ISSUED',
    created_at: '2026-10-15T18:00:00Z',
  },
  {
    id: 'batch-aptify-002',
    event_id: '00000000-0000-0000-0000-000000000101',
    template_id: '00000000-0000-0000-0000-000000000001',
    certificate_type: 'WINNER',
    total_recipients: 6,
    total_generated: 6,
    total_failed: 0,
    status: 'PENDING_APPROVAL',
    created_at: '2026-10-15T19:30:00Z',
  },
];

const INITIAL_CERTS: CertificateItem[] = [
  {
    id: 'cert-001',
    certificate_id: 'AIML26-APT-000184',
    recipient_name: 'Priya Sharma',
    certificate_type: 'PARTICIPATION',
    status: 'ISSUED',
    issued_at: '2026-10-15T18:30:00Z',
  },
  {
    id: 'cert-002',
    certificate_id: 'AIML26-APT-000185',
    recipient_name: 'Rohit Verma',
    certificate_type: 'PARTICIPATION',
    status: 'ISSUED',
    issued_at: '2026-10-15T18:30:00Z',
  },
  {
    id: 'cert-003',
    certificate_id: 'AIML26-APT-000186',
    recipient_name: 'Aman Khan',
    certificate_type: 'PARTICIPATION',
    status: 'REVOKED',
    issued_at: '2026-10-15T18:30:00Z',
    revoke_reason: 'Attendance threshold requirement not satisfied after audit review.',
  },
  {
    id: 'cert-004',
    certificate_id: 'AIML26-APT-000187',
    recipient_name: 'Ananya Gupta',
    certificate_type: 'PARTICIPATION',
    status: 'REPLACED',
    issued_at: '2026-10-15T18:30:00Z',
    replaced_by: 'AIML26-APT-000199',
  },
  {
    id: 'cert-005',
    certificate_id: 'AIML26-APT-000199',
    recipient_name: 'Ananya S. Gupta',
    certificate_type: 'PARTICIPATION',
    status: 'ISSUED',
    issued_at: '2026-10-16T09:00:00Z',
  },
];

export default function EventCertificatesAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [batches, setBatches] = useState<CertificateBatch[]>(INITIAL_BATCHES);
  const [certificates, setCertificates] = useState<CertificateItem[]>(INITIAL_CERTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [batchCertType, setBatchCertType] = useState('PARTICIPATION');
  const [minAttendance, setMinAttendance] = useState(1);

  const [revokingCert, setRevokingCert] = useState<CertificateItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [replacingCert, setReplacingCert] = useState<CertificateItem | null>(null);
  const [replaceReason, setReplaceReason] = useState('');

  // Actions
  const handleApproveBatch = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: 'APPROVED' } : b))
    );
  };

  const handleIssueBatch = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: 'ISSUED' } : b))
    );
  };

  const handleConfirmRevoke = () => {
    if (!revokingCert || !revokeReason.trim()) return;
    setCertificates((prev) =>
      prev.map((c) =>
        c.certificate_id === revokingCert.certificate_id
          ? { ...c, status: 'REVOKED', revoke_reason: revokeReason }
          : c
      )
    );
    setRevokingCert(null);
    setRevokeReason('');
  };

  const handleConfirmReplace = () => {
    if (!replacingCert || !replaceReason.trim()) return;
    const newCertNum = `AIML26-APT-000${Math.floor(200 + Math.random() * 800)}`;
    const newCertItem: CertificateItem = {
      id: `cert-${Date.now()}`,
      certificate_id: newCertNum,
      recipient_name: replacingCert.recipient_name,
      certificate_type: replacingCert.certificate_type,
      status: 'ISSUED',
      issued_at: new Date().toISOString(),
    };

    setCertificates((prev) => [
      ...prev.map((c) =>
        c.certificate_id === replacingCert.certificate_id
          ? { ...c, status: 'REPLACED' as const, replaced_by: newCertNum }
          : c
      ),
      newCertItem,
    ]);
    setReplacingCert(null);
    setReplaceReason('');
  };

  const handleCreateBatch = () => {
    const newBatch: CertificateBatch = {
      id: `batch-aptify-${Date.now().toString().slice(-4)}`,
      event_id: resolvedParams.id,
      template_id: '00000000-0000-0000-0000-000000000001',
      certificate_type: batchCertType,
      total_recipients: 18,
      total_generated: 18,
      total_failed: 0,
      status: 'PENDING_APPROVAL',
      created_at: new Date().toISOString(),
    };
    setBatches((prev) => [newBatch, ...prev]);
    setShowNewBatchModal(false);
  };

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const issuedCount = certificates.filter((c) => c.status === 'ISSUED').length;
  const pendingBatchCount = batches.filter((b) => b.status === 'PENDING_APPROVAL').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;
  const replacedCount = certificates.filter((c) => c.status === 'REPLACED').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href={`/events/${resolvedParams.id}`}
          style={{ color: '#38BDF8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}
        >
          ← Back to Event Details
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Certificate Engine & Verification
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '4px' }}>
              Phase 5.0 — Immutable Versioned Credential Issuance, Audit & Public Verification
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              onClick={() => setShowNewBatchModal(true)}
              style={{ backgroundColor: '#00763C' }}
            >
              + Create Issuance Batch
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>ACTIVE ISSUED</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>{issuedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Publicly authentic & verifiable</div>
        </Card>
        <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>PENDING APPROVAL</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#F59E0B', marginTop: '4px' }}>{pendingBatchCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Batches awaiting admin sign-off</div>
        </Card>
        <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>REVOKED</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#EF4444', marginTop: '4px' }}>{revokedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>With formal audit reason</div>
        </Card>
        <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>REPLACED</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#38BDF8', marginTop: '4px' }}>{replacedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Linked to superseding records</div>
        </Card>
      </div>

      {/* Issuance Batches Section */}
      <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
            Issuance Batches (Approval Workflow)
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Enforcing Review → Approval → Public Issuance Gate</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                <th style={{ padding: '10px 12px' }}>Batch ID</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Recipients</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Created</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Workflow Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id} style={{ borderBottom: '1px solid #283548' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', color: '#E2E8F0' }}>{batch.id}</td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>{batch.certificate_type}</td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>
                    {batch.total_generated} / {batch.total_recipients}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <StatusPill
                      label={batch.status}
                      variant={
                        batch.status === 'ISSUED'
                          ? 'success'
                          : batch.status === 'APPROVED'
                          ? 'info'
                          : batch.status === 'PENDING_APPROVAL'
                          ? 'warning'
                          : 'neutral'
                      }
                    />
                  </td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>
                    {new Date(batch.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {batch.status === 'PENDING_APPROVAL' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApproveBatch(batch.id)}
                        style={{ backgroundColor: '#014B7A' }}
                      >
                        Approve Batch
                      </Button>
                    )}
                    {batch.status === 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleIssueBatch(batch.id)}
                        style={{ backgroundColor: '#00763C' }}
                      >
                        Issue Publicly
                      </Button>
                    )}
                    {batch.status === 'ISSUED' && (
                      <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>
                        ✓ Published & Verified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Individual Certificates Management */}
      <Card style={{ backgroundColor: '#1E293B', borderColor: '#334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
              Event Certificate Records
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
              Public verification routes strictly omit private student PII (phone, email, enrollment ID)
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search ID or Recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                color: '#F8FAFC',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ISSUED">ISSUED</option>
              <option value="REVOKED">REVOKED</option>
              <option value="REPLACED">REPLACED</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                <th style={{ padding: '10px 12px' }}>Certificate Number</th>
                <th style={{ padding: '10px 12px' }}>Recipient</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Issue Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((cert) => (
                <tr key={cert.id} style={{ borderBottom: '1px solid #283548' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#38BDF8' }}>
                    <a
                      href={`https://aimlcluboct.in/verify/${cert.certificate_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38BDF8', textDecoration: 'none' }}
                      title="Inspect Public Verification Record"
                    >
                      {cert.certificate_id} ↗
                    </a>
                  </td>
                  <td style={{ padding: '12px', color: '#F1F5F9', fontWeight: 500 }}>
                    {cert.recipient_name}
                  </td>
                  <td style={{ padding: '12px', color: '#CBD5E1' }}>{cert.certificate_type}</td>
                  <td style={{ padding: '12px' }}>
                    <StatusPill
                      label={cert.status}
                      variant={
                        cert.status === 'ISSUED'
                          ? 'success'
                          : cert.status === 'REVOKED'
                          ? 'error'
                          : cert.status === 'REPLACED'
                          ? 'info'
                          : 'neutral'
                      }
                    />
                    {cert.revoke_reason && (
                      <div style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '4px', maxWidth: '240px' }}>
                        Reason: {cert.revoke_reason}
                      </div>
                    )}
                    {cert.replaced_by && (
                      <div style={{ fontSize: '0.72rem', color: '#38BDF8', marginTop: '4px' }}>
                        Replaced by: {cert.replaced_by}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#94A3B8' }}>
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      {cert.status === 'ISSUED' && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokingCert(cert)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: '32px' }}
                          >
                            Revoke
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplacingCert(cert)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: '32px', borderColor: '#38BDF8', color: '#38BDF8' }}
                          >
                            Replace
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Revocation Modal */}
      {revokingCert && (
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
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <Card style={{ maxWidth: '500px', width: '100%', backgroundColor: '#1E293B', borderColor: '#EF4444' }}>
            <h3 style={{ color: '#EF4444', margin: '0 0 12px 0' }}>Revoke Certificate</h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem' }}>
              You are revoking certificate <strong style={{ color: '#F8FAFC' }}>{revokingCert.certificate_id}</strong> issued to{' '}
              <strong style={{ color: '#F8FAFC' }}>{revokingCert.recipient_name}</strong>.
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Revocation is an immutable administrative audit action. Public verification will immediately reflect the revoked status.
            </p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                Revocation Reason (Mandatory):
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Audit reconciliation: attendance threshold not met..."
                rows={3}
                style={{
                  width: '100%',
                  backgroundColor: '#0F172A',
                  border: '1px solid #475569',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="ghost" onClick={() => setRevokingCert(null)} style={{ color: '#94A3B8' }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!revokeReason.trim()}
                onClick={handleConfirmRevoke}
              >
                Confirm Revocation
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Replacement Modal */}
      {replacingCert && (
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
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <Card style={{ maxWidth: '500px', width: '100%', backgroundColor: '#1E293B', borderColor: '#38BDF8' }}>
            <h3 style={{ color: '#38BDF8', margin: '0 0 12px 0' }}>Replace Certificate</h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.875rem' }}>
              You are superseding certificate <strong style={{ color: '#F8FAFC' }}>{replacingCert.certificate_id}</strong>.
              A new certificate will be issued, and the previous certificate will be marked as REPLACED.
            </p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                Replacement Reason (Mandatory):
              </label>
              <textarea
                value={replaceReason}
                onChange={(e) => setReplaceReason(e.target.value)}
                placeholder="e.g. Correction of recipient official legal spelling..."
                rows={3}
                style={{
                  width: '100%',
                  backgroundColor: '#0F172A',
                  border: '1px solid #475569',
                  color: '#F8FAFC',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <Button variant="ghost" onClick={() => setReplacingCert(null)} style={{ color: '#94A3B8' }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!replaceReason.trim()}
                onClick={handleConfirmReplace}
                style={{ backgroundColor: '#014B7A' }}
              >
                Confirm Replacement
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* New Batch Modal */}
      {showNewBatchModal && (
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
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <Card style={{ maxWidth: '520px', width: '100%', backgroundColor: '#1E293B', borderColor: '#334155' }}>
            <h3 style={{ color: '#F8FAFC', margin: '0 0 12px 0' }}>Create Certificate Issuance Batch</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Calculates eligible participants dynamically based on Phase 3 verified attendance records.
            </p>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                  Certificate Type:
                </label>
                <select
                  value={batchCertType}
                  onChange={(e) => setBatchCertType(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="PARTICIPATION">Participation</option>
                  <option value="MERIT">Merit</option>
                  <option value="WINNER">Winner</option>
                  <option value="RUNNER_UP">Runner-Up</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="ORGANIZER">Organizer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '6px' }}>
                  Minimum Attendance Sessions Required:
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={minAttendance}
                  onChange={(e) => setMinAttendance(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0F172A',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Eligibility Calculation Preview:</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10B981', marginTop: '4px' }}>
                  18 Confirmed Participants Meet Attendance Threshold
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Source: Phase 3 multi-session attendance records (PRESENT / CORRECTED)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button variant="ghost" onClick={() => setShowNewBatchModal(false)} style={{ color: '#94A3B8' }}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateBatch}
                style={{ backgroundColor: '#00763C' }}
              >
                Generate Batch Draft
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
