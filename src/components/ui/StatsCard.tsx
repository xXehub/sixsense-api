'use client';

import { HTMLAttributes, forwardRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  iconColor?: string;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  ({ icon: Icon, iconColor = 'text-primary', value, label, trend, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          group relative overflow-hidden
          bg-[var(--background-card)] border border-[var(--border)]
          rounded-xl p-5
          transition-all duration-200 ease-out
          hover:border-[var(--border-hover)] hover:bg-[var(--background-card-hover)]
          hover:shadow-lg hover:shadow-black/20
          hover:-translate-y-0.5
          ${className}
        `}
        {...props}
      >
        {/* Background glow effect */}
        <div 
          className={`
            absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl
            opacity-0 group-hover:opacity-20 transition-opacity duration-300
            ${iconColor.replace('text-', 'bg-')}
          `}
        />
        
        <div className="relative">
          {/* Icon */}
          <div className={`
            inline-flex items-center justify-center
            w-10 h-10 rounded-lg mb-3
            bg-current/10 ${iconColor}
          `}>
            <Icon className="w-5 h-5" />
          </div>
          
          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[var(--text)] tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* Trend indicator */}
            {trend && (
              <span className={`
                text-xs font-medium px-1.5 py-0.5 rounded
                ${trend.isPositive 
                  ? 'text-green-500 bg-green-500/10' 
                  : 'text-red-500 bg-red-500/10'
                }
              `}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          
          {/* Label */}
          <p className="text-sm text-[var(--text-muted)] mt-1">{label}</p>
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';
