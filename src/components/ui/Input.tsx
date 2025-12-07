'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = 'text',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`
              w-full px-4 py-2.5
              bg-[var(--background-card)] 
              border border-[var(--border)]
              rounded-[var(--radius-sm)]
              text-[var(--text)] text-sm
              placeholder:text-[var(--text-muted)]
              transition-all duration-150
              focus:outline-none focus:border-[var(--primary)]
              focus:ring-2 focus:ring-[var(--primary-glow)]
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-[var(--border-hover)]
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || isPassword ? 'pr-10' : ''}
              ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-red-500/20' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-[var(--error)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-xs text-[var(--text-muted)]">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5
            bg-[var(--background-card)] 
            border border-[var(--border)]
            rounded-[var(--radius-sm)]
            text-[var(--text)] text-sm
            placeholder:text-[var(--text-muted)]
            transition-all duration-150
            focus:outline-none focus:border-[var(--primary)]
            focus:ring-2 focus:ring-[var(--primary-glow)]
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:border-[var(--border-hover)]
            resize-none
            ${error ? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-[var(--error)]">{error}</span>
        )}
        {hint && !error && (
          <span className="text-xs text-[var(--text-muted)]">{hint}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
