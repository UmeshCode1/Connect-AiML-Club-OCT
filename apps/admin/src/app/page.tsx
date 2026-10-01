import React from 'react';
import { Card, StatusPill } from '@connect/ui';

export default function AdminDashboardPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Operational Administration</h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
            AIML Club OCT — Connect Operations & Management Boundary
          </p>
        </div>
        <StatusPill label="Admin Foundation Initialized" variant="info" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Events & Operations</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Manage lifecycle, registrations, Google Drive folders, and participants across assigned events.
          </p>
          <a
            href="/events"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Launch Event Manager →
          </a>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Projects & Innovation</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Review student project submissions, manage lifecycle transitions, verify contributor attributions, and publish showcase items.
          </p>
          <a
            href="/projects"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Projects →
          </a>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Academic Research & Papers</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Editorial review for student and faculty pre-prints, datasets, abstracts, methodologies, and event research tracks.
          </p>
          <a
            href="/research"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Research →
          </a>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Learning Resources</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Catalog Colab notebooks, workshop slides, recordings, and tutorials with difficulty tier tags and event linkages.
          </p>
          <a
            href="/learning"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Learning →
          </a>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Chronicle Editions</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Curate and schedule weekly recaps, monthly digests, and official editorial publications for club members.
          </p>
          <a
            href="/chronicle"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Chronicle →
          </a>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Journey Milestones</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5, marginBottom: '14px' }}>
            Institutional timeline preserving foundation milestones, symposium achievements, partnerships, and leadership legacy.
          </p>
          <a
            href="/journey"
            style={{
              display: 'inline-block',
              backgroundColor: '#014B7A',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Manage Journey →
          </a>
        </Card>
      </div>
    </div>
  );
}
