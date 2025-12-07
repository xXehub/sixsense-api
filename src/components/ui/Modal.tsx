'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children, 
  footer,
  size = 'md' 
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="
        fixed inset-0 z-50
        flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-200
      "
    >
      <div 
        ref={contentRef}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-[var(--background-card)] border border-[var(--border)]
          rounded-xl shadow-2xl shadow-black/40
          animate-in zoom-in-95 slide-in-from-bottom-4 duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            {description && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="
              p-1.5 rounded-lg
              text-[var(--text-muted)] hover:text-[var(--text)]
              hover:bg-[var(--background-lighter)]
              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirm Dialog Variant
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const buttonVariant = variant === 'danger' ? 'primary' : variant === 'warning' ? 'secondary' : 'primary';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={buttonVariant}
            onClick={onConfirm} 
            disabled={loading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-500 border-red-600' : ''}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-[var(--text-muted)]">{description}</p>
    </Modal>
  );
}
