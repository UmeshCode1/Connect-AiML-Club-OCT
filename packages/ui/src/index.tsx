'use client';

import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// 1. BUTTON & ICON BUTTON
// =============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      fontWeight: 600,
      borderRadius: 'var(--radius-md, 8px)',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      transition: 'var(--transition-fast, all 140ms ease)',
      border: '1px solid transparent',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      outline: 'none',
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: 'var(--text-xs, 0.75rem)', minHeight: '36px' },
      md: { padding: '8px 16px', fontSize: 'var(--text-body-sm, 0.875rem)', minHeight: '44px' },
      lg: { padding: '12px 22px', fontSize: 'var(--text-body, 0.9375rem)', minHeight: '48px' },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--color-brand-primary, #014B7A)',
        color: '#FFFFFF',
        borderColor: 'var(--color-brand-primary, #014B7A)',
      },
      secondary: {
        backgroundColor: 'var(--color-brand-secondary, #00763C)',
        color: '#FFFFFF',
        borderColor: 'var(--color-brand-secondary, #00763C)',
      },
      accent: {
        backgroundColor: 'var(--color-brand-accent, #A3E635)',
        color: '#0B0F14',
        borderColor: 'var(--color-brand-accent, #A3E635)',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--color-brand-primary, #014B7A)',
        borderColor: 'var(--color-border-strong, #CBD5E1)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-text-primary, #0F172A)',
        borderColor: 'transparent',
      },
      destructive: {
        backgroundColor: 'var(--color-error, #DC2626)',
        color: '#FFFFFF',
        borderColor: 'var(--color-error, #DC2626)',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          ...baseStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        {...props}
      >
        {isLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'ghost' | 'outline' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  style,
  ...props
}) => {
  const dimensions = size === 'sm' ? '36px' : size === 'lg' ? '48px' : '44px';
  return (
    <button
      aria-label={label}
      title={label}
      style={{
        width: dimensions,
        height: dimensions,
        minWidth: dimensions,
        minHeight: dimensions,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md, 8px)',
        border: variant === 'outline' ? '1px solid var(--color-border, #E2E8F0)' : 'none',
        backgroundColor: variant === 'primary' ? 'var(--color-brand-primary, #014B7A)' : 'transparent',
        color: variant === 'primary' ? '#FFFFFF' : 'var(--color-text-primary, #0F172A)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        transition: 'var(--transition-fast, all 140ms ease)',
        ...style,
      }}
      {...props}
    >
      {icon}
    </button>
  );
};

// =============================================================================
// 2. INPUT, SELECT, SEARCH
// =============================================================================

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, id, style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: 'var(--text-body-sm, 0.875rem)',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0F172A)',
            }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--color-error, #DC2626)', marginLeft: '4px' }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--color-text-muted, #64748B)',
                pointerEvents: 'none',
                display: 'inline-flex',
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: leftIcon ? '8px 12px 8px 38px' : rightIcon ? '8px 38px 8px 12px' : '8px 12px',
              fontSize: 'var(--text-body-sm, 0.875rem)',
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              color: 'var(--color-text-primary, #0F172A)',
              backgroundColor: 'var(--color-surface-white, #FFFFFF)',
              border: `1px solid ${error ? 'var(--color-error, #DC2626)' : 'var(--color-border, #E2E8F0)'}`,
              borderRadius: 'var(--radius-md, 8px)',
              outline: 'none',
              transition: 'border-color 140ms ease, box-shadow 140ms ease',
              ...style,
            }}
            {...props}
          />

          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--color-text-muted, #64748B)',
                display: 'inline-flex',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span style={{ fontSize: 'var(--text-xs, 0.75rem)', color: 'var(--color-error, #DC2626)', fontWeight: 500 }}>
            {error}
          </span>
        )}
        {!error && helperText && (
          <span style={{ fontSize: 'var(--text-xs, 0.75rem)', color: 'var(--color-text-muted, #64748B)' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, style, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--text-body-sm, 0.875rem)',
              fontWeight: 600,
              color: 'var(--color-text-primary, #0F172A)',
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '8px 12px',
            fontSize: 'var(--text-body-sm, 0.875rem)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            color: 'var(--color-text-primary, #0F172A)',
            backgroundColor: 'var(--color-surface-white, #FFFFFF)',
            border: `1px solid ${error ? 'var(--color-error, #DC2626)' : 'var(--color-border, #E2E8F0)'}`,
            borderRadius: 'var(--radius-md, 8px)',
            outline: 'none',
            ...style,
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: 'var(--text-xs, 0.75rem)', color: 'var(--color-error, #DC2626)' }}>{error}</span>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ onClear, value, onChange, ...props }) => {
  return (
    <Input
      type="search"
      value={value}
      onChange={onChange}
      placeholder="Search..."
      leftIcon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      }
      rightIcon={
        value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
};

// =============================================================================
// 3. BADGES & STATUS PILLS
// =============================================================================

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const styles: Record<string, React.CSSProperties> = {
    neutral: { backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0' },
    primary: { backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' },
    secondary: { backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' },
    accent: { backgroundColor: '#F7FEE7', color: '#3F6212', border: '1px solid #D9F99D' },
    outline: { backgroundColor: 'transparent', color: '#475569', border: '1px solid #CBD5E1' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-sm, 4px)',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  label?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'error' | 'info' | 'neutral' | 'brand' | string;
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  variant,
  children,
  style,
  ...props
}) => {
  const textContent = (status || (typeof label === 'string' ? label : '') || (typeof children === 'string' ? children : '')).toString();
  const normalized = textContent.toUpperCase().trim();

  let bg = '#F1F5F9';
  let color = '#475569';
  let border = '#E2E8F0';

  if (variant === 'success' || ['PUBLISHED', 'COMPLETED', 'ACTIVE', 'VERIFIED', 'ATTENDED', 'LIVE', 'ISSUED', 'VALID'].includes(normalized)) {
    bg = 'var(--color-success-bg, #ECFDF5)';
    color = 'var(--color-success-text, #065F46)';
    border = 'var(--color-success-border, #A7F3D0)';
  } else if (variant === 'warning' || ['IN_DEVELOPMENT', 'DRAFT', 'PENDING', 'UPCOMING', 'REVIEW', 'GENERATING', 'PENDING_APPROVAL', 'QUEUED', 'PROCESSING'].includes(normalized)) {
    bg = 'var(--color-warning-bg, #FFFBEB)';
    color = 'var(--color-warning-text, #92400E)';
    border = 'var(--color-warning-border, #FDE68A)';
  } else if (variant === 'danger' || variant === 'error' || ['REJECTED', 'REVOKED', 'FAILED', 'CANCELLED'].includes(normalized)) {
    bg = 'var(--color-error-bg, #FEF2F2)';
    color = 'var(--color-error-text, #991B1B)';
    border = 'var(--color-error-border, #FECACA)';
  } else if (variant === 'info' || ['SYMPOSIUM', 'EVENT', 'WORKSHOP', 'ACADEMIC', 'INFO', 'PROCESSED', 'REPLACED'].includes(normalized)) {
    bg = 'var(--color-info-bg, #EFF6FF)';
    color = 'var(--color-info-text, #1E40AF)';
    border = 'var(--color-info-border, #BFDBFE)';
  } else if (variant === 'brand') {
    bg = '#E0F2FE';
    color = 'var(--color-brand-blue, #014B7A)';
    border = '#BAE6FD';
  }

  const content = label !== undefined ? label : children !== undefined ? children : normalized.replace(/_/g, ' ');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {content}
    </span>
  );
};

export const StatusPill = StatusBadge;

// =============================================================================
// 4. CARD & SECTION
// =============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, elevated = false, interactive = false, style, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-white, #FFFFFF)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #E2E8F0)',
        boxShadow: elevated ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        padding: '24px',
        transition: interactive ? 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, subtitle, action, children, style, ...props }) => {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', ...style }} {...props}>
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: 'var(--text-h2, 1.5rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, #0F172A)',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--text-body-sm, 0.875rem)',
                  color: 'var(--color-text-secondary, #475569)',
                  margin: '4px 0 0 0',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

// =============================================================================
// 5. TABS & BREADCRUMBS
// =============================================================================

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--color-border, #E2E8F0)',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--text-body-sm, 0.875rem)',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--color-brand-primary, #014B7A)' : 'var(--color-text-secondary, #475569)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--color-brand-primary, #014B7A)' : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 140ms ease, border-color 140ms ease',
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'var(--color-brand-primary-subtle, #EFF6FB)' : '#F1F5F9',
                  color: isActive ? 'var(--color-brand-primary, #014B7A)' : '#64748B',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {item.href && !isLast ? (
              <a
                href={item.href}
                style={{
                  color: 'var(--color-brand-primary, #014B7A)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </a>
            ) : (
              <span
                style={{
                  color: isLast ? 'var(--color-text-primary, #0F172A)' : 'var(--color-text-muted, #64748B)',
                  fontWeight: isLast ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            )}
            {!isLast && <span style={{ color: 'var(--color-border-strong, #CBD5E1)' }}>/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// =============================================================================
// 6. MODAL & DRAWER
// =============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children, maxWidth = '560px' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(11, 15, 20, 0.65)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--color-border, #E2E8F0)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border, #E2E8F0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary, #0F172A)' }}>
              {title}
            </h3>
            {description && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-secondary, #475569)' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--color-text-muted, #64748B)',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
};

// =============================================================================
// 7. EMPTY STATE & ERROR STATE
// =============================================================================

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px dashed var(--color-border-strong, #CBD5E1)',
        gap: '16px',
        maxWidth: '640px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-brand-primary-subtle, #EFF6FB)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-brand-primary, #014B7A)',
        }}
      >
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        )}
      </div>

      <div>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary, #0F172A)',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-body-sm, 0.875rem)',
            color: 'var(--color-text-secondary, #475569)',
            lineHeight: 1.5,
            maxWidth: '460px',
          }}
        >
          {description}
        </p>
      </div>

      {action ? (
        <div style={{ marginTop: '8px' }}>{action}</div>
      ) : actionText ? (
        <div style={{ marginTop: '8px' }}>
          {actionHref ? (
            <a
              href={actionHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-brand-primary, #014B7A)',
                color: '#FFFFFF',
                textDecoration: 'none',
                minHeight: '40px',
              }}
            >
              {actionText}
            </a>
          ) : (
            <button
              type="button"
              onClick={onAction}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-brand-primary, #014B7A)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                minHeight: '40px',
              }}
            >
              {actionText}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Service Unavailable',
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: '#FEF2F2',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid #FECACA',
        gap: '14px',
        maxWidth: '560px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#DC2626',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.0625rem', fontWeight: 700, color: '#991B1B' }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#7F1D1D', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} style={{ borderColor: '#DC2626', color: '#DC2626' }}>
          Retry Request
        </Button>
      )}
    </div>
  );
};

// =============================================================================
// 8. LOADING SKELETON
// =============================================================================

export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const LoadingSkeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md, 8px)',
  style,
}) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading..."
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E2E8F0',
        backgroundImage: 'linear-gradient(90deg, #E2E8F0 0%, #F1F5F9 50%, #E2E8F0 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

// =============================================================================
// 9. AVATAR & TIMELINE
// =============================================================================

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {
  const dimensions = size === 'sm' ? '32px' : size === 'lg' ? '56px' : '40px';
  const fontSize = size === 'sm' ? '0.75rem' : size === 'lg' ? '1.25rem' : '0.875rem';

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: dimensions,
          height: dimensions,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--color-border, #E2E8F0)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: dimensions,
        height: dimensions,
        minWidth: dimensions,
        minHeight: dimensions,
        borderRadius: '50%',
        backgroundColor: 'var(--color-brand-primary, #014B7A)',
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

export interface TimelineItemProps {
  date: string;
  title: string;
  description: string;
  category?: string;
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ date, title, description, category, isLast = false }) => {
  return (
    <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
      {/* Spine & Marker */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-brand-primary, #014B7A)',
            border: '3px solid #EFF6FB',
            boxShadow: '0 0 0 1px var(--color-brand-primary, #014B7A)',
            zIndex: 1,
            marginTop: '4px',
          }}
        />
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              backgroundColor: 'var(--color-border-strong, #CBD5E1)',
              margin: '4px 0',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: isLast ? '0' : '32px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--color-brand-primary, #014B7A)',
            }}
          >
            {date}
          </span>
          {category && <StatusBadge status={category} />}
        </div>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-text-primary, #0F172A)',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-body-sm, 0.875rem)',
            color: 'var(--color-text-secondary, #475569)',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

// =============================================================================
// 10. DATA TABLE (ADMIN OPERATIONAL)
// =============================================================================

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  emptyMessage = 'No records found.',
  onRowClick,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--color-text-muted, #64748B)',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--color-border, #E2E8F0)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--color-border, #E2E8F0)',
        backgroundColor: '#FFFFFF',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr
            style={{
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid var(--color-border, #E2E8F0)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary, #475569)',
                  textAlign: col.align || 'left',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: idx === data.length - 1 ? 'none' : '1px solid var(--color-border, #E2E8F0)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 120ms ease',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
              onMouseLeave={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '14px 16px',
                    color: 'var(--color-text-primary, #0F172A)',
                    textAlign: col.align || 'left',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] != null ? String((row as Record<string, unknown>)[col.key]) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// 11. BRAND HEADER LOCKUP
// =============================================================================

export interface BrandHeaderProps {
  showTagline?: boolean;
  theme?: 'light' | 'dark';
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ showTagline = true, theme = 'light' }) => {
  const isDark = theme === 'dark';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
      <img
        src="/brand/aiml-club-mark-101.png"
        alt="AIML Club OCT Logo"
        width={38}
        height={38}
        style={{ borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: '1.0625rem',
            color: isDark ? '#FFFFFF' : 'var(--color-brand-primary, #014B7A)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          AIML CLUB OCT{' '}
          <span
            style={{
              fontWeight: 500,
              color: isDark ? 'var(--color-brand-accent, #A3E635)' : 'var(--color-text-secondary, #475569)',
            }}
          >
            — CONNECT
          </span>
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: '0.75rem',
              color: isDark ? '#94A3B8' : 'var(--color-brand-secondary, #00763C)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Innovate. Implement. Inspire.
          </div>
        )}
      </div>
    </div>
  );
};
