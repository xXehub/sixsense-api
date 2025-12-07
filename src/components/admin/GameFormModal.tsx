'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';

interface Game {
  id: string;
  place_id: string;
  game_name: string;
  description?: string;
  thumbnail_url?: string;
  script_version: string;
  min_key_tier: string;
  is_active: boolean;
}

interface GameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  game?: Game | null;
}

const keyTiers = [
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
  { value: 'vip', label: 'VIP' },
];

export default function GameFormModal({
  isOpen,
  onClose,
  onSuccess,
  game,
}: GameFormModalProps) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    place_id: '',
    game_name: '',
    description: '',
    thumbnail_url: '',
    script_version: '2.0.0',
    min_key_tier: 'free',
    is_active: true,
  });

  useEffect(() => {
    if (game) {
      setFormData({
        place_id: game.place_id,
        game_name: game.game_name,
        description: game.description || '',
        thumbnail_url: game.thumbnail_url || '',
        script_version: game.script_version,
        min_key_tier: game.min_key_tier,
        is_active: game.is_active,
      });
    } else {
      setFormData({
        place_id: '',
        game_name: '',
        description: '',
        thumbnail_url: '',
        script_version: '2.0.0',
        min_key_tier: 'free',
        is_active: true,
      });
    }
  }, [game, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = game
        ? `/api/admin/games/${game.id}`
        : '/api/admin/games';

      const res = await fetch(url, {
        method: game ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save game');

      addToast(
        game ? 'Game updated successfully' : 'Game created successfully',
        'success'
      );
      onSuccess();
      onClose();
    } catch (error) {
      addToast('Failed to save game', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={game ? 'Edit Game' : 'Add Game'}
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
            {isLoading ? 'Saving...' : game ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Place ID *
          </label>
          <input
            type="text"
            value={formData.place_id}
            onChange={(e) =>
              setFormData({ ...formData, place_id: e.target.value })
            }
            placeholder="e.g., 2788229376"
            required
            disabled={!!game}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Game Name *
          </label>
          <input
            type="text"
            value={formData.game_name}
            onChange={(e) =>
              setFormData({ ...formData, game_name: e.target.value })
            }
            placeholder="e.g., Da Hood"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter game description..."
            rows={3}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Thumbnail URL (Optional)
          </label>
          <input
            type="url"
            value={formData.thumbnail_url}
            onChange={(e) =>
              setFormData({ ...formData, thumbnail_url: e.target.value })
            }
            placeholder="https://..."
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to auto-fetch from Roblox
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Script Version *
          </label>
          <input
            type="text"
            value={formData.script_version}
            onChange={(e) =>
              setFormData({ ...formData, script_version: e.target.value })
            }
            placeholder="e.g., 2.0.0"
            required
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Minimum Key Tier *
          </label>
          <select
            value={formData.min_key_tier}
            onChange={(e) =>
              setFormData({ ...formData, min_key_tier: e.target.value })
            }
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
          >
            {keyTiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
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
