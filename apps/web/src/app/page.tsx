import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BRAND, normalizeApiUrl } from '@connect/config';
import { Card, Button, StatusBadge, EmptyState } from '@connect/ui';
import type { Project, ResearchItem, LearningResource, JourneyMilestone } from '@connect/types';

export const metadata: Metadata = {
  title: 'AIML CLUB OCT — CONNECT | Digital Infrastructure & Student Ecosystem',
  description:
    'Official academic platform and digital infrastructure of the AI & Machine Learning Club, Oriental College of Technology Bhopal. Innovate. Implement. Inspire.',
};

interface EventItem {
  id: string;
  slug: string;
  event_code: string;
  title: string;
  short_description?: string;
  event_type: string;
  status: string;
  venue?: string;
  start_at: string;
  end_at: string;
  capacity?: number;
}

async function getHomeData() {
  const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

  const [eventsRes, projectsRes, researchRes, learningRes, journeyRes] = await Promise.allSettled([
    fetch(`${apiUrl}/v1/events?page_size=10`, { next: { revalidate: 60 } }),
    fetch(`${apiUrl}/v1/projects?page_size=6`, { next: { revalidate: 60 } }),
    fetch(`${apiUrl}/v1/research?page_size=4`, { next: { revalidate: 60 } }),
    fetch(`${apiUrl}/v1/learning?page_size=4`, { next: { revalidate: 60 } }),
    fetch(`${apiUrl}/v1/journey?page_size=3`, { next: { revalidate: 60 } }),
  ]);

  let events: EventItem[] = [];
  let projects: Project[] = [];
  let research: ResearchItem[] = [];
  let learning: LearningResource[] = [];
  let journey: JourneyMilestone[] = [];

  if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
    try {
      const json = await eventsRes.value.json();
      events = (json.data || []).filter((e: any) => e.visibility === 'PUBLIC' && e.status !== 'DRAFT');
    } catch { }
  }

  if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
    try {
      const json = await projectsRes.value.json();
      projects = (json.data || []).filter((p: any) => p.visibility === 'PUBLIC' && p.status !== 'IDEA' && p.status !== 'ARCHIVED');
    } catch { }
  }

  if (researchRes.status === 'fulfilled' && researchRes.value.ok) {
    try {
      const json = await researchRes.value.json();
      research = (json.data || []).filter((r: any) => r.visibility === 'PUBLIC' && r.status === 'PUBLISHED');
    } catch { }
  }

  if (learningRes.status === 'fulfilled' && learningRes.value.ok) {
    try {
      const json = await learningRes.value.json();
      learning = (json.data || []).filter((l: any) => l.visibility === 'PUBLIC');
    } catch { }
  }

  if (journeyRes.status === 'fulfilled' && journeyRes.value.ok) {
    try {
      const json = await journeyRes.value.json();
      journey = (json.data || []).filter((m: any) => m.visibility === 'PUBLIC' && m.status === 'PUBLISHED');
    } catch { }
  }

  return { events, projects, research, learning, journey };
}

export default async function HomePage() {
  const { events, projects, research, learning, journey } = await getHomeData();

  // Find primary upcoming or live event
  const featuredEvent = events.find(
    (e) => e.status === 'REGISTRATION_OPEN' || e.status === 'LIVE' || e.status === 'UPCOMING'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Editorial University Masthead Banner */}
      <section
        style={{
          backgroundColor: '#111820',
          borderRadius: '16px',
          padding: '48px 36px',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '32px',
          border: '1px solid #1D2630',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                backgroundColor: 'rgba(163, 230, 53, 0.15)',
                color: '#A3E635',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                padding: '4px 10px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Academic Community &amp; Research Chapter
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Oriental College of Technology, Bhopal</span>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            AIML CLUB OCT <span style={{ color: '#A3E635' }}>— CONNECT</span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: '#A3E635',
              fontWeight: 600,
              fontStyle: 'italic',
              margin: 0,
            }}
          >
            &ldquo;{BRAND.tagline}&rdquo;
          </p>

          <p style={{ fontSize: '0.975rem', color: '#CBD5E1', lineHeight: 1.65, margin: 0 }}>
            The official unified platform for students, faculty, and engineering practitioners in Artificial
            Intelligence &amp; Machine Learning at Oriental College of Technology. Archiving symposiums, student research
            papers, applied edge deployments, and verified academic credentials.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
            <Link href="/events" style={{ textDecoration: 'none' }}>
              <Button variant="primary" style={{ backgroundColor: '#014B7A' }}>
                Explore Symposiums →
              </Button>
            </Link>
            <Link href="/projects" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" style={{ backgroundColor: '#00763C', color: '#FFFFFF' }}>
                Applied Projects
              </Button>
            </Link>
            <Link href="/research" style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ borderColor: '#64748B', color: '#F8FAFC' }}>
                Academic Research
              </Button>
            </Link>
            <Link href="/me/certificates" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" style={{ color: '#E2E8F0', border: '1px solid #334155' }}>
                Verify Credentials
              </Button>
            </Link>
          </div>
        </div>

        {/* Institutional Crest & Club Mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '24px 28px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <img
            src="/brand/oct-bhopal-emblem.png"
            alt="Oriental College of Technology Bhopal Crest"
            width={95}
            height={125}
            style={{ objectFit: 'contain' }}
          />
          <div style={{ width: '1px', height: '90px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <img
            src="/brand/aiml-club-logo-500.png"
            alt="AIML Club OCT Official Emblem"
            width={110}
            height={110}
            style={{ objectFit: 'contain' }}
          />
        </div>
      </section>

      {/* Featured Upcoming / Live Event Banner */}
      {featuredEvent && (
        <section aria-labelledby="featured-event-heading">
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#00763C',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              UPCOMING FLAGSHIP SYMPOSIUM
            </span>
          </div>

          <Card
            elevated
            style={{
              borderLeft: '5px solid #00763C',
              padding: '28px 32px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <StatusBadge status={featuredEvent.status} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#014B7A',
                      backgroundColor: '#E0F2FE',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {featuredEvent.event_type}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>• {featuredEvent.event_code}</span>
                </div>

                <h2
                  id="featured-event-heading"
                  style={{
                    fontSize: '1.65rem',
                    fontWeight: 800,
                    color: '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.015em',
                  }}
                >
                  {featuredEvent.title}
                </h2>

                {featuredEvent.short_description && (
                  <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                    {featuredEvent.short_description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    fontSize: '0.85rem',
                    color: '#64748B',
                    marginTop: '4px',
                  }}
                >
                  {featuredEvent.start_at && (
                    <div>
                      📅{' '}
                      {new Date(featuredEvent.start_at).toLocaleDateString('en-IN', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  {featuredEvent.venue && <div>📍 {featuredEvent.venue}</div>}
                  {featuredEvent.capacity && <div>👥 {featuredEvent.capacity} Capacity</div>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                <Link href={`/events/${featuredEvent.slug}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%', backgroundColor: '#00763C' }}>
                    Register for Event →
                  </Button>
                </Link>
                <Link href={`/events/${featuredEvent.slug}`} style={{ textDecoration: 'none' }}>
                  <Button variant="outline" style={{ width: '100%' }}>
                    View Schedule
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Applied Student Projects Showcase */}
      <section aria-labelledby="projects-heading">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#014B7A',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              ENGINEERING DELIVERABLES
            </span>
            <h2
              id="projects-heading"
              style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', margin: 0 }}
            >
              Applied AI &amp; Software Projects
            </h2>
          </div>
          <Link
            href="/projects"
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#014B7A', textDecoration: 'none' }}
          >
            Browse All Projects ({projects.length}) →
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects published yet"
            description="Projects submitted by club members will appear here after editorial and technical evaluation."
            actionText="Submit a Project"
            actionHref="/projects/submit"
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {projects.map((proj) => (
              <Card
                key={proj.id}
                elevated
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <StatusBadge status={proj.status} />
                    {proj.is_featured && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#A3E635',
                          backgroundColor: '#111820',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        FEATURED
                      </span>
                    )}
                  </div>

                  <Link href={`/projects/${proj.slug}`} style={{ textDecoration: 'none' }}>
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: '#014B7A',
                        margin: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {proj.title}
                    </h3>
                  </Link>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#475569',
                      marginTop: '8px',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {proj.summary}
                  </p>

                  {proj.technology_stack && proj.technology_stack.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                      {proj.technology_stack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#F1F5F9',
                            padding: '2px 7px',
                            borderRadius: '4px',
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '12px',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    {proj.members && proj.members.length > 0
                      ? `${proj.members[0].student_full_name}${proj.members.length > 1 ? ` +${proj.members.length - 1}` : ''}`
                      : 'AIML Club OCT'}
                  </span>
                  <Link href={`/projects/${proj.slug}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="sm">
                      Inspect System →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Academic Research Archive Showcase */}
      <section aria-labelledby="research-heading">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#00763C',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              SCHOLARLY PUBLICATIONS
            </span>
            <h2
              id="research-heading"
              style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', margin: 0 }}
            >
              Academic Pre-prints &amp; Papers
            </h2>
          </div>
          <Link
            href="/research"
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#00763C', textDecoration: 'none' }}
          >
            Browse Research Archive ({research.length}) →
          </Link>
        </div>

        {research.length === 0 ? (
          <EmptyState
            title="No research publications yet"
            description="Faculty and student authored machine learning pre-prints, datasets, and conference papers will be cataloged here."
            actionText="Browse Knowledge"
            actionHref="/learning"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {research.map((item) => (
              <Card key={item.id} elevated style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ maxWidth: '850px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#00763C',
                          backgroundColor: '#ECFDF5',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.category || 'AI/ML'}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>

                    <Link href={`/research/${item.slug}`} style={{ textDecoration: 'none' }}>
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          margin: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {item.title}
                      </h3>
                    </Link>

                    <div style={{ fontSize: '0.825rem', color: '#64748B', marginTop: '4px' }}>
                      Authors:{' '}
                      <strong>
                        {item.authors && item.authors.length > 0
                          ? item.authors.map((a) => a.name).join(', ')
                          : 'Club Research Group'}
                      </strong>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '8px', lineHeight: 1.5 }}>
                      {item.abstract}
                    </p>
                  </div>

                  <Link href={`/research/${item.slug}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="sm">
                      Read Pre-print →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Curated Learning Resources Showcase */}
      <section aria-labelledby="learning-heading">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#D97706',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              CURATED KNOWLEDGE
            </span>
            <h2
              id="learning-heading"
              style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', margin: 0 }}
            >
              Learning Resources &amp; Lab Notebooks
            </h2>
          </div>
          <Link
            href="/learning"
            style={{ fontSize: '0.875rem', fontWeight: 600, color: '#D97706', textDecoration: 'none' }}
          >
            Access All Resources ({learning.length}) →
          </Link>
        </div>

        {learning.length === 0 ? (
          <EmptyState
            title="No learning resources published yet"
            description="PyTorch interactive notebooks, workshop slide decks, and lab guides will appear here accompanying club events."
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {learning.map((res) => (
              <Card
                key={res.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#B45309',
                        backgroundColor: '#FEF3C7',
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      {res.resource_type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      {res.difficulty_level}
                    </span>
                  </div>

                  <Link href={`/learning/${res.slug}`} style={{ textDecoration: 'none' }}>
                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#0F172A',
                        margin: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {res.title}
                    </h3>
                  </Link>

                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: '#475569',
                      marginTop: '6px',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {res.description}
                  </p>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <Link href={`/learning/${res.slug}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="sm" style={{ width: '100%' }}>
                      Access Resource ↗
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Institutional Journey Preview */}
      {journey.length > 0 && (
        <section aria-labelledby="journey-heading">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#014B7A',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                OUR HERITAGE
              </span>
              <h2
                id="journey-heading"
                style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '2px', margin: 0 }}
              >
                Club Journey &amp; Milestones
              </h2>
            </div>
            <Link
              href="/journey"
              style={{ fontSize: '0.875rem', fontWeight: 600, color: '#014B7A', textDecoration: 'none' }}
            >
              View Full Timeline →
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {journey.map((m) => (
              <Card key={m.id} style={{ padding: '20px', borderLeft: '4px solid #014B7A' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#014B7A', marginBottom: '4px' }}>
                  {m.milestone_date
                    ? new Date(m.milestone_date).toLocaleDateString('en-IN', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : m.milestone_type}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {m.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
