'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, StatusPill, Button } from '@connect/ui';

interface MediaItem {
  id: string;
  media_type: 'PHOTO' | 'VIDEO' | 'DOCUMENT';
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  google_drive_file_id: string;
  visibility: string;
  processing_status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  created_at: string;
  detected_faces?: number;
  matched_faces?: number;
}

const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-01',
    media_type: 'PHOTO',
    title: 'Aptify 2026 Keynote Stage',
    original_filename: 'aptify_keynote_stage.jpg',
    mime_type: 'image/jpeg',
    file_size: 4200000,
    google_drive_file_id: '1DriveFileAptifyKeynotePhoto001',
    visibility: 'PUBLIC',
    processing_status: 'PROCESSED',
    created_at: '2026-10-15T10:15:00Z',
    detected_faces: 4,
    matched_faces: 3,
  },
  {
    id: 'med-02',
    media_type: 'PHOTO',
    title: 'Deep Learning Workshop Lab Hall',
    original_filename: 'dl_workshop_hall.jpg',
    mime_type: 'image/jpeg',
    file_size: 5800000,
    google_drive_file_id: '1DriveFileAptifyWorkshopLab002',
    visibility: 'EVENT_MEMBERS',
    processing_status: 'PROCESSED',
    created_at: '2026-10-15T12:30:00Z',
    detected_faces: 12,
    matched_faces: 9,
  },
  {
    id: 'med-03',
    media_type: 'PHOTO',
    title: 'Audience Q&A Session',
    original_filename: 'audience_qa_session.jpg',
    mime_type: 'image/jpeg',
    file_size: 3400000,
    google_drive_file_id: '1DriveFileAptifyAudienceQA003',
    visibility: 'EVENT_MEMBERS',
    processing_status: 'QUEUED',
    created_at: '2026-10-15T14:45:00Z',
  },
];

export default function EventMediaManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [mediaList, setMediaList] = useState<MediaItem[]>(INITIAL_MEDIA);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputes, setDisputes] = useState([
    {
      id: 'rep-01',
      student_id: 'std-0126al221001',
      student_name: 'Aman Sharma',
      enrollment_no: '0126AL221001',
      media_title: 'Aptify 2026 Keynote Stage',
      report_type: 'NOT_ME',
      description: 'I was sitting in row 5, the tagged person is in row 2.',
      status: 'OPEN',
      created_at: '2026-10-15T16:00:00Z',
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    original_filename: '',
    mime_type: 'image/jpeg',
    google_drive_file_id: '',
    visibility: 'EVENT_MEMBERS',
  });

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.original_filename || !formData.google_drive_file_id) return;

    const newItem: MediaItem = {
      id: 'med-' + Date.now().toString(36),
      media_type: formData.mime_type.startsWith('video') ? 'VIDEO' : 'PHOTO',
      title: formData.title || formData.original_filename,
      original_filename: formData.original_filename,
      mime_type: formData.mime_type,
      file_size: 3500000,
      google_drive_file_id: formData.google_drive_file_id,
      visibility: formData.visibility,
      processing_status: 'QUEUED',
      created_at: new Date().toISOString(),
    };

    setMediaList((prev) => [newItem, ...prev]);
    setShowUploadModal(false);
    setFormData({
      title: '',
      original_filename: '',
      mime_type: 'image/jpeg',
      google_drive_file_id: '',
      visibility: 'EVENT_MEMBERS',
    });
  };

  const handleResolveDispute = (reportId: string, status: 'RESOLVED_DISPUTED' | 'DISMISSED') => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === reportId ? { ...d, status } : d))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation */}
      <div>
        <Link
          href={`/events/${eventId}`}
          style={{ color: '#38BDF8', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '8px' }}
        >
          ← Back to Event Overview
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#F8FAFC' }}>
              Media Assets & Intelligence
            </h1>
            <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '4px' }}>
              Immutable Google Drive assets, asynchronous indexing pipeline, and biometric privacy gate.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDisputeModal(true)}
            >
              Face Disputes ({disputes.filter((d) => d.status === 'OPEN').length})
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowUploadModal(true)}
            >
              + Ingest Media Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy Gate Architecture Callout */}
      <div
        style={{
          backgroundColor: '#0C1B2E',
          border: '1px solid #0284C7',
          borderRadius: '8px',
          padding: '16px 20px',
          color: '#E0F2FE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
          <span>🛡️ Biometric Privacy Gate Active</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#BAE6FD', marginTop: '6px', lineHeight: 1.5 }}>
          Raw vectors are isolated in PostgreSQL <code>pgvector</code> and never exposed to browser APIs.
          Face discovery is strictly event-scoped and limited to attendees with active opt-in consent.
          Disputed matches are unlinked upon student report.
        </p>
      </div>

      {/* Media Assets Roster */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
              Ingested Event Media ({mediaList.length})
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
              Google Drive Root: <code>1DriveFolderAptify2026Photos</code>
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '12px 16px' }}>Asset Title & File</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Google Drive File ID</th>
                  <th style={{ padding: '12px 16px' }}>Processing Status</th>
                  <th style={{ padding: '12px 16px' }}>Detections / Consented Matches</th>
                  <th style={{ padding: '12px 16px' }}>Visibility</th>
                </tr>
              </thead>
              <tbody>
                {mediaList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.title}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B' }}>
                        {item.original_filename} ({(item.file_size / (1024 * 1024)).toFixed(1)}MB)
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#94A3B8' }}>{item.media_type}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#38BDF8' }}>
                      {item.google_drive_file_id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusPill
                        label={item.processing_status}
                        variant={
                          item.processing_status === 'PROCESSED'
                            ? 'success'
                            : item.processing_status === 'FAILED'
                            ? 'error'
                            : 'neutral'
                        }
                      />
                    </td>
                    <td style={{ padding: '14px 16px', color: '#CBD5E1' }}>
                      {item.detected_faces !== undefined ? (
                        <span>
                          <strong>{item.detected_faces}</strong> faces / <strong>{item.matched_faces}</strong> matched
                        </span>
                      ) : (
                        <span style={{ color: '#64748B' }}>In queue</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#1E293B',
                          color: '#E2E8F0',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.visibility}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Ingest Media Modal */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #334155',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              Register Google Drive Media Asset
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Files are stored on Google Drive. Connect validates MIME constraints and stores the immutable ID.
            </p>

            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '4px' }}>
                  Title / Caption
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Keynote Speaker Closing"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '4px' }}>
                  Original Filename
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. keynote_closing.jpg"
                  value={formData.original_filename}
                  onChange={(e) => setFormData({ ...formData, original_filename: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '4px' }}>
                  Google Drive Immutable File ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1AbCdEfGhIjKlMnOpQrStUv"
                  value={formData.google_drive_file_id}
                  onChange={(e) => setFormData({ ...formData, google_drive_file_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '4px' }}>
                    MIME Type
                  </label>
                  <select
                    value={formData.mime_type}
                    onChange={(e) => setFormData({ ...formData, mime_type: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  >
                    <option value="image/jpeg">image/jpeg (Photo)</option>
                    <option value="image/png">image/png (Photo)</option>
                    <option value="video/mp4">video/mp4 (Video)</option>
                    <option value="application/pdf">application/pdf (Doc)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#E2E8F0', marginBottom: '4px' }}>
                    Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', color: '#FFF' }}
                  >
                    <option value="EVENT_MEMBERS">EVENT_MEMBERS</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="ADMIN_ONLY">ADMIN_ONLY</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="outline" size="md" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" type="submit">
                  Confirm Ingestion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Disputes Review Modal */}
      {showDisputeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#111820',
              border: '1px solid #334155',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
                Student Face Disputes ("Not Me")
              </h3>
              <Button variant="outline" size="sm" onClick={() => setShowDisputeModal(false)}>
                Close
              </Button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Students can report false positive detections. Disputed matches are immediately unlinked from their profile upon resolution.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {disputes.map((d) => (
                <div
                  key={d.id}
                  style={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#F8FAFC' }}>
                      {d.student_name} ({d.enrollment_no})
                    </div>
                    <StatusPill
                      label={d.status}
                      variant={d.status === 'OPEN' ? 'warning' : 'neutral'}
                    />
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                    Photo: <strong>{d.media_title}</strong> • Reason: <em>"{d.description}"</em>
                  </div>

                  {d.status === 'OPEN' && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveDispute(d.id, 'DISMISSED')}
                      >
                        Dismiss Report
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveDispute(d.id, 'RESOLVED_DISPUTED')}
                      >
                        Confirm & Unlink Match
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
