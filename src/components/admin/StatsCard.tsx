'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'premium' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    container: 'bg-[#111111] border-[#222222]',
    icon: 'bg-primary/15 text-primary',
  },
  premium: {
    container: 'bg-[#111111] border-[#222222]',
    icon: 'bg-amber-500/15 text-amber-500',
  },
  success: {
    container: 'bg-[#111111] border-[#222222]',
    icon: 'bg-emerald-500/15 text-emerald-500',
  },
  warning: {
    container: 'bg-[#111111] border-[#222222]',
    icon: 'bg-blue-500/15 text-blue-500',
  },
};

export default function StatsCard({ icon: Icon, label, value, change, variant = 'default' }: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`
      group rounded-lg border
      ${styles.container}
      transition-colors duration-200
      hover:border-[#333333]
    `}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`
            p-2.5 rounded-lg
            ${styles.icon}
          `}>
            <Icon className="h-5 w-5" />
          </div>
          
          {change && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${
              change.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {change.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{change.value}%</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
