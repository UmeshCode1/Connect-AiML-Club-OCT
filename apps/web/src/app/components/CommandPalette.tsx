'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeApiUrl } from '@connect/config';
import type { SearchResultItem } from '@connect/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store last focused element when opening, restore on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setError(null);
      setSelectedIndex(0);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle global Escape and Tab focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search against /v1/search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
        const res = await fetch(`${apiUrl}/v1/search?q=${encodeURIComponent(trimmed)}&limit=15`);
        if (!res.ok) {
          throw new Error('Search request failed');
        }
        const data = await res.json();
        const items: SearchResultItem[] = data.data || [];
        setResults(items);
        setSelectedIndex(0);
      } catch (err: any) {
        setError(err.message || 'Unable to execute search');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigate to item
  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      onClose();
      if (item.url) {
        router.push(item.url);
      }
    },
    [onClose, router]
  );

  // Keyboard navigation within list
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group results by entity type
  const groupedResults = results.reduce<Record<string, SearchResultItem[]>>((acc, item) => {
    const key = item.entity_type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const getEntityBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'project':
        return { label: 'Project', bg: '#E0F2FE', text: '#0369A1' };
      case 'research':
        return { label: 'Research', bg: '#ECFDF5', text: '#065F46' };
      case 'learning':
        return { label: 'Learning', bg: '#FFFBEB', text: '#B45309' };
      case 'event':
        return { label: 'Event', bg: '#EEF2FF', text: '#4338CA' };
      case 'chronicle':
        return { label: 'Chronicle', bg: '#F5F3FF', text: '#6D28D9' };
      case 'journey':
        return { label: 'Journey', bg: '#F0FDFA', text: '#0F766E' };
      case 'team':
        return { label: 'Team', bg: '#F3F4F6', text: '#374151' };
      case 'certificate':
        return { label: 'Verified Certificate', bg: '#FFE4E6', text: '#BE123C' };
      default:
        return { label: type, bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Platform Global Search"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '80px 16px 24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            gap: '12px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search projects, research papers, workshops, events, or credentials..."
            aria-label="Search prompt"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: '#0F172A',
              backgroundColor: 'transparent',
            }}
          />
          {loading && (
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid #CBD5E1',
                borderTopColor: '#014B7A',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
              aria-label="Searching..."
            />
          )}
          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              background: 'none',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div
          ref={listRef}
          role="listbox"
          style={{
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {query.trim().length < 2 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
              <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Universal Institutional Search
              </p>
              <p>Type at least 2 characters to search across all verified AIML Club OCT assets.</p>
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                {['Vision AI', 'Transformer', 'PyTorch', 'Aptify', 'Symposium'].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setQuery(kw)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: '0.75rem',
                      color: '#014B7A',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#FEF2F2',
                color: '#991B1B',
                borderRadius: '8px',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && !error && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B' }}>
              <p style={{ fontWeight: 600, color: '#334155' }}>No matching records found</p>
              <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;.
              </p>
              <p style={{ fontSize: '0.75rem', marginTop: '8px', color: '#94A3B8' }}>
                Tip: For credentials, search using the exact Certificate ID (e.g. AIML26-APT-000184).
              </p>
            </div>
          )}

          {results.length > 0 &&
            Object.entries(groupedResults).map(([entityType, items]) => {
              const badge = getEntityBadge(entityType);
              return (
                <div key={entityType} style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#64748B',
                      padding: '4px 8px',
                    }}
                  >
                    {badge.label}s ({items.length})
                  </div>
                  {items.map((item) => {
                    const currentIndex = results.indexOf(item);
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        data-active={isSelected}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#F0F9FF' : 'transparent',
                          border: isSelected ? '1px solid #BAE6FD' : '1px solid transparent',
                          transition: 'background-color 100ms ease',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.9375rem',
                                fontWeight: 600,
                                color: isSelected ? '#0369A1' : '#0F172A',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.description && (
                            <p
                              style={{
                                fontSize: '0.8125rem',
                                color: '#64748B',
                                marginTop: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: badge.bg,
                            color: badge.text,
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>
              <kbd style={{ padding: '1px 5px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#FFF' }}>↑</kbd>{' '}
              <kbd style={{ padding: '1px 5px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#FFF' }}>↓</kbd> to navigate
            </span>
            <span>
              <kbd style={{ padding: '1px 5px', border: '1px solid #CBD5E1', borderRadius: '4px', background: '#FFF' }}>↵</kbd> to select
            </span>
          </div>
          <div>Authorized AIML Club OCT Registry</div>
        </div>
      </div>
    </div>
  );
}
