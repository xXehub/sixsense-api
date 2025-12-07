'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const Icon = variant === 'danger' ? AlertCircle : AlertTriangle;
  const iconColor = variant === 'danger' ? 'text-red-500' : 'text-amber-500';
  const iconBg = variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10';
  const buttonColor =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-amber-600 hover:bg-amber-700';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-background-card border border-white/10 shadow-xl transition-all">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full p-3 ${iconBg}`}>
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-lg font-bold text-white mb-2">
                        {title}
                      </Dialog.Title>
                      <p className="text-sm text-gray-400">{description}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      autoFocus
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={onConfirm}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
                    >
                      {isLoading ? 'Processing...' : confirmText}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
