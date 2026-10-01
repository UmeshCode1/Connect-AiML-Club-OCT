'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { normalizeApiUrl } from '@connect/config';
import { Card, StatusBadge, Button, EmptyState } from '@connect/ui';
import type { Project, ResearchItem } from '@connect/types';

interface EventItem {
  id: string;
  slug: string;
  event_code: string;
  title: string;
  event_type: string;
  status: string;
  start_at: string;
  capacity?: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [pendingResearch, setPendingResearch] = useState<ResearchItem[]>([]);

  useEffect(() => {
    async function loadOperationalData() {
      setLoading(true);
      try {
        const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

        const [evRes, projRes, resRes] = await Promise.allSettled([
          fetch(`${apiUrl}/v1/events?page_size=20`, {
            headers: { Authorization: 'Bearer dev-admin-token' },
          }),
          fetch(`${apiUrl}/v1/projects?page_size=50`, {
            headers: { Authorization: 'Bearer dev-admin-token' },
          }),
          fetch(`${apiUrl}/v1/research?page_size=50`, {
            headers: { Authorization: 'Bearer dev-admin-token' },
          }),
        ]);

        if (evRes.status === 'fulfilled' && evRes.value.ok) {
          const body = await evRes.value.json();
          setEvents(body.data || []);
        }

        if (projRes.status === 'fulfilled' && projRes.value.ok) {
          const body = await projRes.value.json();
          const allProjects: Project[] = body.data || [];
          setPendingProjects(allProjects.filter((p) => p.status === 'IDEA' || p.status === 'IN_DEVELOPMENT'));
        }

        if (resRes.status === 'fulfilled' && resRes.value.ok) {
          const body = await resRes.value.json();
          const allResearch: ResearchItem[] = body.data || [];
          setPendingResearch(allResearch.filter((r) => r.status === 'DRAFT'));
        }
      } catch (err) {
        console.error('Failed to load operational admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOperationalData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Operational Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #1E293B',
          paddingBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                textTransform: 'uppercase',
              }}
            >
              Mission Control
            </span>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>AIML CLUB OCT — Operations Boundary</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: '6px 0 0 0' }}>
            Operational Administration
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/events/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary" style={{ backgroundColor: '#014B7A' }}>
              + Create Event
            </Button>
          </Link>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <Button variant="outline" style={{ borderColor: '#334155', color: '#E2E8F0' }}>
              Review Submissions
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Modules Quick Access Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Events & Sessions', href: '/events', count: events.length },
          { label: 'Student Projects', href: '/projects', count: pendingProjects.length, badge: 'in review' },
          { label: 'Research Papers', href: '/research', count: pendingResearch.length, badge: 'drafts' },
          { label: 'Learning Library', href: '/learning' },
          { label: 'Chronicle Editions', href: '/chronicle' },
          { label: 'Journey Milestones', href: '/journey' },
        ].map((mod) => (
          <Link
            key={mod.label}
            href={mod.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
              backgroundColor: '#111820',
              border: '1px solid #1E293B',
              borderRadius: '8px',
              textDecoration: 'none',
              transition: 'border-color 150ms ease',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>{mod.label}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              {mod.count !== undefined ? (
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 700 }}>
                  {mod.count} {mod.badge ? mod.badge : 'records'}
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Catalog</span>
              )}
              <span style={{ color: '#64748B', fontSize: '0.85rem' }}>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Dual Queue Layout: Active Events & Submissions Awaiting Action */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Active Events Roster */}
        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF', padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid #1E293B',
              paddingBottom: '12px',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38BDF8', margin: 0 }}>
              Events &amp; Symposiums Roster
            </h2>
            <Link href="/events" style={{ fontSize: '0.8rem', color: '#94A3B8', textDecoration: 'none' }}>
              Manage all →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              Querying operational event state...
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No scheduled events</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Create an event to initiate registration and sessions.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <Link
                      href={`/events/${evt.id}`}
                      style={{
                        fontWeight: 600,
                        color: '#F8FAFC',
                        fontSize: '0.9rem',
                        textDecoration: 'none',
                      }}
                    >
                      {evt.title}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                      {evt.event_code} • {evt.event_type}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={evt.status} />
                    <Link
                      href={`/events/${evt.id}`}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#1E293B',
                        color: '#E2E8F0',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Editorial Submissions Review Queue */}
        <Card style={{ backgroundColor: '#111820', borderColor: '#1E293B', color: '#FFFFFF', padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid #1E293B',
              paddingBottom: '12px',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38BDF8', margin: 0 }}>
              Editorial Review Queue
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Pending: <strong>{pendingProjects.length + pendingResearch.length}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
              Checking submission queue...
            </div>
          ) : pendingProjects.length === 0 && pendingResearch.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#94A3B8' }}>Review queue is clear</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                No student project submissions or research pre-prints awaiting editorial approval.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#A3E635', fontWeight: 700 }}>PROJECT SUBMISSION</span>
                    <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem', marginTop: '2px' }}>
                      {p.title}
                    </div>
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#014B7A',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Review →
                  </Link>
                </div>
              ))}

              {pendingResearch.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>RESEARCH DRAFT</span>
                    <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem', marginTop: '2px' }}>
                      {r.title}
                    </div>
                  </div>
                  <Link
                    href={`/research/${r.id}`}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#014B7A',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
