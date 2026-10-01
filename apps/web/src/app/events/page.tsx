import React from 'react';
import type { Metadata } from 'next';
import { normalizeApiUrl } from '@connect/config';
import EventsClient, { EventItem } from './EventsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events & Symposiums — AIML CLUB OCT',
  description:
    'Discover upcoming artificial intelligence symposiums, competitive programming sprints, workshops, and hackathons hosted by the AI & Machine Learning Club, Oriental College of Technology Bhopal.',
  openGraph: {
    title: 'Events & Symposiums — AIML CLUB OCT',
    description: 'Explore upcoming and completed AI/ML events, workshops, and symposiums at OCT Bhopal.',
  },
};

async function getPublicEvents(): Promise<EventItem[]> {
  try {
    const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(`${apiUrl}/v1/events?page_size=50`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const body = await res.json();
      const list: EventItem[] = body.data || [];
      return list.filter((e) => e.visibility === 'PUBLIC' && e.status !== 'DRAFT');
    }
  } catch (err) {
    console.error('Failed to fetch events from API:', err);
  }
  return [];
}

export default async function EventsPage() {
  const events = await getPublicEvents();
  return <EventsClient initialEvents={events} />;
}
