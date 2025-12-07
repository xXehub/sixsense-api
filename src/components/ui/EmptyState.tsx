'use client';

import { ReactNode } from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="
      flex flex-col items-center justify-center py-16 px-6
      text-center
    ">
      <div className="
        w-16 h-16 rounded-2xl mb-4
        bg-[var(--primary)]/10 
        flex items-center justify-center
      ">
        <Icon className="w-8 h-8 text-[var(--primary)]" />
      </div>
      
      <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
