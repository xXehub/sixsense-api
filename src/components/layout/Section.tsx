'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingStyles = {
  none: '',
  sm: 'py-8 sm:py-12',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-24',
  xl: 'py-24 sm:py-32',
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ padding = 'lg', className = '', children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={`
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </section>
    );
  }
);

Section.displayName = 'Section';

// Section Header component
interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  centered?: boolean;
  gradient?: boolean;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, subtitle, centered = true, gradient = true, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          mb-12
          ${centered ? 'text-center' : ''}
          ${className}
        `}
        {...props}
      >
        <h2
          className={`
            text-3xl sm:text-4xl font-bold
            ${gradient ? 'text-gradient' : 'text-[var(--text)]'}
          `}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';

export default Section;
