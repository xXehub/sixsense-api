'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';

interface Key {
  id: string;
  key: string;
  user_id: string;
  key_type: string;
  hwid?: string;
  expires_at: string;
  max_resets: number;
  is_active: boolean;
}

interface KeyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  keyData?: Key | null;
}

const keyTypes = [
  { value: 'daily', label: 'Daily (24h)' },
  { value: 'weekly', label: 'Weekly (7 days)' },
  { value: 'monthly', label: 'Monthly (30 days)' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'premium', label: 'Premium (30 days)' },
  { value: 'vip', label: 'VIP (Lifetime)' },
];

export default function KeyFormModal({
  isOpen,
  onClose,
  onSuccess,
  keyData,
}: KeyFormModalProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    key_type: 'daily',
    hwid: '',
    max_resets: 3,
    is_active: true,
  });

  useEffect(() => {
    if (keyData) {
      setFormData({
        user_id: keyData.user_id,
        key_type: keyData.key_type,
        hwid: keyData.hwid || '',
        max_resets: keyData.max_resets,
        is_active: keyData.is_active,
      });
    } else {
      setFormData({
        user_id: '',
        key_type: 'daily',
        hwid: '',
        max_resets: 3,
        is_active: true,
      });
    }
  }, [keyData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = keyData
        ? `/api/admin/keys/${keyData.id}`
        : '/api/admin/keys';

      const res = await fetch(url, {
        method: keyData ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save key');

      addToast(
        keyData ? 'Key updated successfully' : 'Key created successfully',
        'success'
      );
      onSuccess();
      onClose();
    } catch (error) {
      addToast('Failed to save key', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={keyData ? 'Edit Key' : 'Create Key'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(74,222,128,0.5)]"
          >
            {isLoading ? 'Saving...' : keyData ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            User Discord ID *
          </label>
          <input
            type="text"
            value={formData.user_id}
            onChange={(e) =>
              setFormData({ ...formData, user_id: e.target.value })
            }
            placeholder="Enter Discord ID"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            The Discord ID of the user who will own this key
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Key Type *
          </label>
          <select
            value={formData.key_type}
            onChange={(e) =>
              setFormData({ ...formData, key_type: e.target.value })
            }
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
          >
            {keyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            HWID (Optional)
          </label>
          <input
            type="text"
            value={formData.hwid}
            onChange={(e) =>
              setFormData({ ...formData, hwid: e.target.value })
            }
            placeholder="Leave empty for auto-generation"
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hardware ID will be auto-generated if left empty
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Max Resets *
          </label>
          <input
            type="number"
            value={formData.max_resets}
            onChange={(e) =>
              setFormData({ ...formData, max_resets: parseInt(e.target.value) })
            }
            min="0"
            max="100"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
          />
          <label htmlFor="is_active" className="text-sm text-white">
            Active
          </label>
        </div>
      </form>
    </Modal>
  );
}
