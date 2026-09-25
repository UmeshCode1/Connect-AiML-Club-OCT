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
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Manage lifecycle, registrations, Google Drive folders, and participants across assigned events.
          </p>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Integrations Status</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Tally webhooks, Google Sheets sync engine, and Google Drive storage manager health checks.
          </p>
        </Card>

        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#38BDF8', marginBottom: '8px' }}>Audit & Governance</h3>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Append-only audit logs capturing consequential role changes, data exports, and certificate operations.
          </p>
        </Card>
      </div>
    </div>
  );
}
