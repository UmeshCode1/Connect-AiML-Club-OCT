import React from 'react';

// -----------------------------------------------------------------------------
// Button Component
// -----------------------------------------------------------------------------

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md, 8px)',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.65 : 1,
    transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
    border: '1px solid transparent',
    textDecoration: 'none',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.875rem', minHeight: '36px' },
    md: { padding: '8px 16px', fontSize: '0.9375rem', minHeight: '44px' }, // touch target ≥ 44px
    lg: { padding: '12px 24px', fontSize: '1rem', minHeight: '48px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-brand-primary, #014B7A)',
      color: '#FFFFFF',
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: 'var(--color-brand-secondary, #00763C)',
      color: '#FFFFFF',
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-brand-primary, #014B7A)',
      borderColor: 'var(--color-brand-primary, #014B7A)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary, #111827)',
      borderColor: 'transparent',
    },
    destructive: {
      backgroundColor: 'var(--color-error, #DC2626)',
      color: '#FFFFFF',
      borderColor: 'transparent',
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {isLoading ? 'Processing...' : children}
    </button>
  );
};

// -----------------------------------------------------------------------------
// Status Pill Component
// -----------------------------------------------------------------------------

export interface StatusPillProps {
  label: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'error';
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, variant = 'neutral' }) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    neutral: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
    success: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    warning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
    info: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    error: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  };

  const c = colors[variant] || colors.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        backgroundColor: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {label}
    </span>
  );
};

// -----------------------------------------------------------------------------
// Card Component
// -----------------------------------------------------------------------------

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, elevated = false, style, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-white, #FFFFFF)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #E5EAF0)',
        boxShadow: elevated ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding: '20px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Brand Header Lockup Component
// -----------------------------------------------------------------------------

export interface BrandHeaderProps {
  showTagline?: boolean;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ showTagline = true }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img
        src="/brand/aiml-club-mark-101.png"
        alt="AIML Club OCT Logo"
        width={36}
        height={36}
        style={{ borderRadius: '50%', objectFit: 'contain' }}
      />
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-brand-primary, #014B7A)', lineHeight: 1.2 }}>
          AIML CLUB OCT <span style={{ fontWeight: 400, color: 'var(--color-text-secondary, #5B6573)' }}>— CONNECT</span>
        </div>
        {showTagline && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-brand-secondary, #00763C)', fontWeight: 600, letterSpacing: '0.03em' }}>
            Innovate. Implement. Inspire.
          </div>
        )}
      </div>
    </div>
  );
};
