import React from 'react';
import { BRAND } from '@connect/config';
import { Card, Button, StatusPill } from '@connect/ui';

export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: 'var(--color-dark-surface, #111820)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '48px 32px',
          color: '#FFFFFF',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '32px',
          border: '1px solid var(--color-dark-elevated, #1D2630)',
        }}
      >
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusPill label="Engineering Foundation Phase" variant="info" />
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Phase 0 / 1 Initialized</span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            AIML CLUB OCT <span style={{ color: 'var(--color-brand-accent, #A3E635)' }}>— CONNECT</span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'var(--color-brand-accent, #A3E635)', fontWeight: 600 }}>
            &ldquo;{BRAND.tagline}&rdquo;
          </p>

          <p style={{ fontSize: '1rem', color: '#CBD5E1', lineHeight: 1.6 }}>
            The unified digital infrastructure for the AI & Machine Learning Club at Oriental College of Technology, Bhopal.
            Extending our student community, events, verified credentials, and institutional legacy.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
            <a href="/events">
              <Button variant="primary">Explore Events</Button>
            </a>
            <a href="/projects">
              <Button variant="secondary" style={{ backgroundColor: '#00763C', color: '#FFF' }}>
                AI Projects
              </Button>
            </a>
            <a href="/verify/smoke-check">
              <Button variant="outline" style={{ borderColor: '#64748B', color: '#F8FAFC' }}>
                Verify Certificate
              </Button>
            </a>
            <a href="/auth">
              <Button variant="ghost" style={{ color: '#E2E8F0', border: '1px solid #334155' }}>
                Member Portal
              </Button>
            </a>
          </div>
        </div>

        {/* Brand Badges Showcase */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            padding: '24px',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <img
            src="/brand/oct-bhopal-emblem.png"
            alt="Oriental College of Technology Bhopal Emblem"
            width={100}
            height={130}
            style={{ objectFit: 'contain' }}
          />
          <div style={{ width: '1px', height: '100px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <img
            src="/brand/aiml-club-logo-500.png"
            alt="AIML Club OCT Logo"
            width={120}
            height={120}
            style={{ objectFit: 'contain' }}
          />
        </div>
      </section>

      {/* Knowledge & Innovation Showcase Hub */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00763C', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            KNOWLEDGE &amp; ACADEMIC HUB
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#014B7A', marginTop: '2px' }}>
            Institutional Showcase &amp; Open Resources
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Card elevated style={{ borderLeft: '4px solid #014B7A', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#014B7A' }}>Applied Projects</h3>
                <StatusPill label="Showcase" variant="info" />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                Real-world intelligent campus systems, computer vision edge nodes, and student hackathon deliverables with verified team attribution.
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <a href="/projects" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm">Explore Projects →</Button>
              </a>
            </div>
          </Card>

          <Card elevated style={{ borderLeft: '4px solid #00763C', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#00763C' }}>Research Pre-prints</h3>
                <StatusPill label="Academic" variant="success" />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                Peer-reviewed conference papers, lightweight transformer benchmarks, and faculty-mentored machine learning studies from OCT Bhopal.
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <a href="/research" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm">Browse Research →</Button>
              </a>
            </div>
          </Card>

          <Card elevated style={{ borderLeft: '4px solid #D97706', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#D97706' }}>Learning Resources</h3>
                <StatusPill label="Open Access" variant="warning" />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                Curated PyTorch Google Colab notebooks, workshop slide presentations, and hands-on lab code accompanying club symposiums.
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <a href="/learning" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="sm">Access Labs →</Button>
              </a>
            </div>
          </Card>
        </div>
      </section>

      {/* Platform Architecture Status Overview */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>API & Backend</h3>
            <StatusPill label="Configured" variant="success" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', lineHeight: 1.5 }}>
            FastAPI application configured for <code>{BRAND.apiDomain}</code> with standardized envelopes, OpenAPI documentation, and health endpoints.
          </p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Database Foundation</h3>
            <StatusPill label="Configured" variant="success" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', lineHeight: 1.5 }}>
            Supabase PostgreSQL schema with <code>pgvector</code>, <code>pg_trgm</code>, granular RBAC, and strict separation of student identity and event participation.
          </p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Large-File Storage</h3>
            <StatusPill label="Architected" variant="info" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', lineHeight: 1.5 }}>
            Google Drive integrated via immutable file/folder IDs. Application database remains the authoritative structured source of truth.
          </p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Security & RBAC</h3>
            <StatusPill label="Established" variant="success" />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', lineHeight: 1.5 }}>
            Server-side authorization boundaries, 8 core platform roles, zero-secret commit policies, and strict biometric privacy safeguards.
          </p>
        </Card>
      </section>
    </div>
  );
}
