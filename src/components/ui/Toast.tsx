'use client';

import { Fragment, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const variantStyles = {
  success: {
    bg: 'bg-green-500/10 border-green-500/50',
    icon: 'text-green-500',
    Icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500/10 border-red-500/50',
    icon: 'text-red-500',
    Icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/50',
    icon: 'text-amber-500',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500/10 border-blue-500/50',
    icon: 'text-blue-500',
    Icon: Info,
  },
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { bg, icon, Icon } = variantStyles[toast.variant];

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <Transition
      appear
      show={true}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-x-full opacity-0"
      enterTo="translate-x-0 opacity-100"
      leave="transform ease-in duration-200 transition"
      leaveFrom="translate-x-0 opacity-100"
      leaveTo="translate-x-full opacity-0"
    >
      <div
        className={`flex items-start gap-3 w-full max-w-sm rounded-lg border ${bg} px-4 py-3 shadow-lg backdrop-blur-sm`}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${icon}`} />
        <p className="flex-1 text-sm text-white">{toast.message}</p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </Transition>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
