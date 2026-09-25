'use client';

import React, { useState } from 'react';
import { Card, Button, StatusPill } from '@connect/ui';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });

      if (error) {
        setMessage(`Auth notice: ${error.message}`);
      } else {
        setMessage('Check your email for the magic link to sign in.');
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Authentication boundary initialized.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '48px auto' }}>
      <Card elevated>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <StatusPill label="Authentication Boundary" variant="info" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-brand-primary, #014B7A)' }}>
            Sign In to Connect
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #5B6573)', marginTop: '4px' }}>
            Access personal registrations, attendance, and certificates.
          </p>
        </div>

        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}
            >
              College / Registered Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="e.g. student@oriental.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--color-border, #E5EAF0)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            />
          </div>

          <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%' }}>
            Send Magic Link
          </Button>

          {message && (
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: '#F1F5F9',
                fontSize: '0.8125rem',
                color: '#334155',
                border: '1px solid #CBD5E1',
              }}
            >
              {message}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
