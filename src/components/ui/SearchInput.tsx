'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-9 text-sm pl-9 pr-3',
  md: 'h-10 text-sm pl-10 pr-4',
  lg: 'h-11 text-base pl-11 pr-4',
};

const iconSizeStyles = {
  sm: 'left-2.5 w-4 h-4',
  md: 'left-3 w-4 h-4',
  lg: 'left-3.5 w-5 h-5',
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${iconSizeStyles[size]}`}>
          {icon || <Search className="w-full h-full" />}
        </div>
        <input
          ref={ref}
          type="text"
          className={`
            w-full ${sizeStyles[size]}
            bg-[var(--background-card)] 
            border border-[var(--border)]
            rounded-lg
            text-[var(--text)] placeholder:text-[var(--text-muted)]
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50
            hover:border-[var(--border-hover)]
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
