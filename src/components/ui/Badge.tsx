'use client';

import { HTMLAttributes, forwardRef } from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--background-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
  primary: 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30',
  secondary: 'bg-[var(--background-card)] text-[var(--text-secondary)] border border-[var(--border)]',
  success: 'bg-green-500/10 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  error: 'bg-red-500/10 text-red-400 border border-red-500/30',
  outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  primary: 'bg-[var(--primary)]',
  secondary: 'bg-[var(--text-secondary)]',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  outline: 'bg-[var(--text-muted)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      pulse = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5
          rounded-full font-medium
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span className="relative flex h-2 w-2">
            {pulse && (
              <span
                className={`
                  absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping
                  ${dotColors[variant]}
                `}
              />
            )}
            <span
              className={`
                relative inline-flex rounded-full h-2 w-2
                ${dotColors[variant]}
              `}
            />
          </span>
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
