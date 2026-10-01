'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { normalizeApiUrl } from '@connect/config';
import { Card, Button, StatusPill } from '@connect/ui';

export default function ProjectSubmitPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProject, setSubmittedProject] = useState<any | null>(null);

  const urlPattern = /^https?:\/\/.+/i;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim() || !summary.trim() || !problem.trim() || !solution.trim()) {
      setError('Please fill in all required fields (Title, Summary, Problem, Solution).');
      return;
    }

    if (repoUrl.trim() && !urlPattern.test(repoUrl.trim())) {
      setError('Repository URL must begin with http:// or https://');
      return;
    }

    if (demoUrl.trim() && !urlPattern.test(demoUrl.trim())) {
      setError('Demo URL must begin with http:// or https://');
      return;
    }

    if (docUrl.trim() && !urlPattern.test(docUrl.trim())) {
      setError('Documentation URL must begin with http:// or https://');
      return;
    }

    const techStack = techStackInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const description = `### Problem Statement\n${problem.trim()}\n\n### Proposed Solution & Architecture\n${solution.trim()}`;

    setLoading(true);

    try {
      const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
      const token = localStorage.getItem('connect_access_token') || 'dev-student-token';

      const res = await fetch(`${apiUrl}/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          description,
          technology_stack: techStack,
          repository_url: repoUrl.trim() || undefined,
          demo_url: demoUrl.trim() || undefined,
          documentation_url: docUrl.trim() || undefined,
          visibility: 'PUBLIC',
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error?.message || 'Failed to submit project proposal');
      }

      setSubmittedProject(body.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your proposal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <Link
          href="/projects"
          style={{
            fontSize: '0.875rem',
            color: '#014B7A',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back to Projects Directory
        </Link>
      </div>

      {submittedProject ? (
        <Card elevated style={{ padding: '36px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              color: '#059669',
              fontSize: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#014B7A', marginBottom: '8px' }}>
            Proposal Submitted for Editorial Review
          </h2>
          <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 20px' }}>
            Thank you for submitting <strong>{submittedProject.title}</strong>. Your project proposal has been queued for
            technical review by the AIML Club OCT committee.
          </p>

          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '16px',
              maxWidth: '500px',
              margin: '0 auto 24px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.875rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Status:</span>
              <StatusPill label={submittedProject.status || 'Under Review'} variant="warning" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Your Role:</span>
              <span style={{ fontWeight: 600, color: '#0369A1' }}>Project Lead (Automatic Designation)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Review Protocol:</span>
              <span style={{ color: '#334155' }}>Editorial Moderation Required</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/projects" style={{ textDecoration: 'none' }}>
              <Button variant="primary">Return to Projects Directory</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSubmittedProject(null);
                setTitle('');
                setSummary('');
                setProblem('');
                setSolution('');
                setTechStackInput('');
                setRepoUrl('');
                setDemoUrl('');
                setDocUrl('');
              }}
            >
              Submit Another Project
            </Button>
          </div>
        </Card>
      ) : (
        <Card elevated style={{ padding: '36px' }}>
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#00763C',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              STUDENT INNOVATION INITIATIVE
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#014B7A', marginTop: '4px' }}>
              Propose a Project
            </h1>
            <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '8px', lineHeight: 1.5 }}>
              Have you built an applied machine learning model, autonomous robotics tool, or smart campus platform?
              Submit your project for club verification, showcase attribution, and technical mentorship.
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.875rem',
                border: '1px solid #FECACA',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Project Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campus Edge Vision: Real-Time Safety Surveillance"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Summary */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                One-Sentence Summary <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of what this project accomplishes"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Problem Statement */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Problem Statement <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                required
                rows={3}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="What challenge, research gap, or campus problem does your project address?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Proposed Solution */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Proposed Solution &amp; Technical Approach <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Describe your architecture, model selections, and software components..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Technology Stack */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Technology Stack (comma-separated)
              </label>
              <input
                type="text"
                value={techStackInput}
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="e.g. Python, PyTorch, YOLOv8, FastAPI, Docker"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9375rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* External Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Repository URL (GitHub / GitLab)
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://demo.aimlcluboct.in"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Documentation URL (Optional)
                </label>
                <input
                  type="url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://docs...."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>

            {/* Editorial Policy Note */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '0.8125rem',
                color: '#1E40AF',
                lineHeight: 1.5,
              }}
            >
              <strong>Editorial Approval Policy:</strong> In order to protect student privacy and ensure verified technical
              attribution, all proposals enter a moderation state upon submission. Club administrators or content managers
              will review your submission prior to public listing.
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Link href="/projects" style={{ textDecoration: 'none' }}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button variant="primary" type="submit" isLoading={loading}>
                Submit for Editorial Review
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
