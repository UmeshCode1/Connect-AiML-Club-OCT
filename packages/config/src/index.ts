/**
 * AIML CLUB OCT — CONNECT
 * Brand Constants, Design Tokens & Domain Config
 *
 * Source: 06_DESIGN_SYSTEM.md & 07_DOMAIN_ARCHITECTURE.md
 */

export const BRAND = {
  name: 'AIML CLUB OCT — CONNECT',
  shortName: 'Connect',
  organization: 'AI & Machine Learning Club, Oriental College of Technology, Bhopal',
  tagline: 'Innovate. Implement. Inspire.',
  primaryDomain: 'aimlcluboct.in',
  appDomain: 'app.aimlcluboct.in',
  adminDomain: 'admin.aimlcluboct.in',
  apiDomain: 'api.aimlcluboct.in',
} as const;

export const THEME_TOKENS = {
  colors: {
    // Primary Institutional Colors
    brandPrimary: '#014B7A', // Institutional Blue
    brandSecondary: '#00763C', // Institutional Green
    brandAccent: '#A3E635', // Club Logo Lime (used sparingly)
    
    // Neutrals
    nearBlack: '#0B0F14',
    darkSurface: '#111820',
    darkElevated: '#1D2630',
    lightBackground: '#F7F9FB',
    white: '#FFFFFF',
    border: '#E5EAF0',
    strongBorder: '#CBD3DC',
    
    // Typography
    textPrimary: '#111827',
    textSecondary: '#5B6573',
    textMuted: '#8A95A3',
    
    // Semantic
    success: '#00763C',
    warning: '#D97706',
    error: '#DC2626',
    info: '#014B7A',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  typography: {
    fontFamilySans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    fontFamilyMono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  }
} as const;

export const RBAC_ROLES = [
  'SUPER_ADMIN',
  'CLUB_ADMIN',
  'EVENT_MANAGER',
  'MEDIA_MANAGER',
  'CERTIFICATE_MANAGER',
  'CONTENT_MANAGER',
  'VOLUNTEER',
  'VIEWER'
] as const;

/**
 * Normalizes the API base URL, preventing accidental double '/v1/v1' pathing
 * regardless of whether NEXT_PUBLIC_API_URL contains a trailing /v1 or trailing slash.
 */
export function normalizeApiUrl(rawUrl?: string): string {
  const url = rawUrl || (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined) || 'http://localhost:8000';
  return url.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
}

