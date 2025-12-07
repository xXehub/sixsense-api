'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';

interface User {
  id: string;
  discord_id: string;
  discord_username: string;
  email?: string;
  role: string;
  is_banned: boolean;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: UserFormModalProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    discord_id: '',
    discord_username: '',
    email: '',
    role: 'user',
    is_banned: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        discord_id: user.discord_id,
        discord_username: user.discord_username,
        email: user.email || '',
        role: user.role,
        is_banned: user.is_banned,
      });
    } else {
      setFormData({
        discord_id: '',
        discord_username: '',
        email: '',
        role: 'user',
        is_banned: false,
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = user
        ? `/api/admin/users/${user.id}`
        : '/api/admin/users';
      
      const res = await fetch(url, {
        method: user ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save user');

      addToast(
        user ? 'User updated successfully' : 'User created successfully',
        'success'
      );
      onSuccess();
      onClose();
    } catch (error) {
      addToast('Failed to save user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Create User'}
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
            {isLoading ? 'Saving...' : user ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Discord ID *
          </label>
          <input
            type="text"
            value={formData.discord_id}
            onChange={(e) =>
              setFormData({ ...formData, discord_id: e.target.value })
            }
            disabled={!!user}
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Discord Username *
          </label>
          <input
            type="text"
            value={formData.discord_username}
            onChange={(e) =>
              setFormData({ ...formData, discord_username: e.target.value })
            }
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_banned"
            checked={formData.is_banned}
            onChange={(e) =>
              setFormData({ ...formData, is_banned: e.target.checked })
            }
            className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary"
          />
          <label htmlFor="is_banned" className="text-sm text-white">
            Ban this user
          </label>
        </div>
      </form>
    </Modal>
  );
}
