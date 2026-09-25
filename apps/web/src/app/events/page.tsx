import React from 'react';
import { Card, StatusPill, Button } from '@connect/ui';

export default function EventsIndexPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-brand-primary, #014B7A)' }}>
            Club Events & Activities
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary, #5B6573)', marginTop: '4px' }}>
            Workshops, hackathons, seminars, and competitions organized by AIML Club OCT.
          </p>
        </div>
        <StatusPill label="Public Surface" variant="info" />
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <StatusPill label="Sample Event" variant="success" />
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Code: EVT-APTIFY-2026</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Aptify 2.0: AI & Machine Learning Symposium</h2>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', marginTop: '6px', maxWidth: '680px' }}>
              Flagship event celebrating innovation, student research, and machine learning practical workflows at Oriental College of Technology.
            </p>
          </div>
          <a href="/verify/AIML26-APT-000184">
            <Button variant="outline" size="sm">
              View Sample Credential
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
