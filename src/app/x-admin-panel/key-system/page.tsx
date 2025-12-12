'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Key, Save, Plus, Trash2, Edit2, X, Check, ExternalLink,
  ToggleLeft, ToggleRight, DollarSign, Clock, Link2, Palette,
  ArrowUp, ArrowDown, Settings, Layers, Crown, Gift
} from 'lucide-react';

interface KeyProvider {
  id: number;
  provider_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  api_key: string | null;
  base_url: string;
  link_id: string | null;
  link_slug?: string | null; // Work.ink specific: URL slug
  full_url: string | null;
  key_duration_days: number;
  is_active: boolean;
  is_premium: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface KeySystemSettings {
  free_key_enabled: string;
  premium_enabled: string;
  premium_price_usd: string;
  premium_duration_days: string;
  max_keys_per_user: string;
  key_cooldown_hours: string;
  require_discord_link: string;
  system_message: string;
}

const defaultSettings: KeySystemSettings = {
  free_key_enabled: 'true',
  premium_enabled: 'true',
  premium_price_usd: '4.99',
  premium_duration_days: '30',
  max_keys_per_user: '3',
  key_cooldown_hours: '24',
  require_discord_link: 'false',
  system_message: ''
};

const providerIcons: Record<string, string> = {
  linkvertise: '🔗',
  lootlabs: '🎮',
  workink: '💼',
  custom: '⚡'
};

export default function KeySystemPage() {
  const [activeTab, setActiveTab] = useState<'providers' | 'settings' | 'integrations'>('providers');
  const [providers, setProviders] = useState<KeyProvider[]>([]);
  const [settings, setSettings] = useState<KeySystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProvider, setEditingProvider] = useState<KeyProvider | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/key-providers');
      const data = await res.json();
      if (data.success) {
        setProviders(data.data);
      } else {
        setError('Failed to fetch providers');
      }
    } catch (err) {
      setError('Error fetching providers');
      console.error(err);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/key-system/settings');
      const data = await res.json();
      if (data.success) {
        setSettings({ ...defaultSettings, ...data.data });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    Promise.all([fetchProviders(), fetchSettings()]).finally(() => setLoading(false));
  }, [fetchProviders, fetchSettings]);

  // Clear messages after delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Toggle provider active status
  const toggleProvider = async (provider: KeyProvider) => {
    try {
      const res = await fetch(`/api/admin/key-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !provider.is_active })
      });
      const data = await res.json();
      if (data.success) {
        setProviders(prev => prev.map(p => 
          p.id === provider.id ? { ...p, is_active: !p.is_active } : p
        ));
        setSuccess(`${provider.name} ${!provider.is_active ? 'enabled' : 'disabled'}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to toggle provider');
    }
  };

  // Update provider priority
  const updatePriority = async (provider: KeyProvider, direction: 'up' | 'down') => {
    const newPriority = direction === 'up' ? provider.priority - 1 : provider.priority + 1;
    if (newPriority < 0) return;

    try {
      const res = await fetch(`/api/admin/key-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });
      const data = await res.json();
      if (data.success) {
        await fetchProviders();
      }
    } catch (err) {
      setError('Failed to update priority');
    }
  };

  // Delete provider
  const deleteProvider = async (provider: KeyProvider) => {
    if (!confirm(`Delete ${provider.name}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/key-providers/${provider.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setProviders(prev => prev.filter(p => p.id !== provider.id));
        setSuccess(`${provider.name} deleted`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete provider');
    }
  };

  // Save provider (create/update)
  const saveProvider = async (provider: Partial<KeyProvider>) => {
    setSaving(true);
    try {
      const isUpdate = provider.id !== undefined;
      const url = isUpdate 
        ? `/api/admin/key-providers/${provider.id}` 
        : '/api/admin/key-providers';
      
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider)
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(isUpdate ? 'Provider updated' : 'Provider created');
        await fetchProviders();
        setEditingProvider(null);
        setShowAddModal(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save provider');
    } finally {
      setSaving(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/key-system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Settings saved successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Key System
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure monetization providers and key system settings
          </p>
        </div>
        {activeTab === 'settings' && (
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1a1a1a] pb-4">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'providers' 
              ? 'bg-primary text-black' 
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          Providers
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'settings' 
              ? 'bg-primary text-black' 
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'integrations' 
              ? 'bg-primary text-black' 
              : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
          }`}
        >
          <Link2 className="h-4 w-4" />
          Integrations
        </button>
      </div>

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          {/* Add Provider Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-md hover:bg-[#252525] transition-colors border border-[#2a2a2a]"
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </button>

          {/* Provider Cards */}
          <div className="grid gap-4">
            {providers.length === 0 ? (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8 text-center">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No providers configured</p>
                <p className="text-gray-500 text-sm mt-1">Add a provider to start monetizing your keys</p>
              </div>
            ) : (
              providers.map((provider) => (
                <div 
                  key={provider.id}
                  className={`bg-[#111111] border rounded-lg p-4 transition-all ${
                    provider.is_active 
                      ? 'border-primary/30' 
                      : 'border-[#1a1a1a] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Provider Icon */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${provider.color}20` }}
                      >
                        {provider.icon || providerIcons[provider.provider_id] || '🔗'}
                      </div>
                      
                      {/* Provider Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{provider.name}</h3>
                          {provider.is_premium && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                          {!provider.is_premium && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                              <Gift className="h-3 w-3" />
                              Free
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{provider.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {provider.key_duration_days} day key
                          </span>
                          <span className="flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {provider.provider_id}
                          </span>
                          <span className="flex items-center gap-1">
                            Priority: {provider.priority}
                          </span>
                        </div>
                        {provider.full_url && (
                          <a 
                            href={provider.full_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {provider.full_url.substring(0, 50)}...
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Priority Controls */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updatePriority(provider, 'up')}
                          className="p-1 text-gray-500 hover:text-white transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updatePriority(provider, 'down')}
                          className="p-1 text-gray-500 hover:text-white transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => toggleProvider(provider)}
                        className={`p-2 rounded-md transition-colors ${
                          provider.is_active 
                            ? 'text-primary hover:bg-primary/10' 
                            : 'text-gray-500 hover:bg-gray-800'
                        }`}
                        title={provider.is_active ? 'Disable' : 'Enable'}
                      >
                        {provider.is_active ? (
                          <ToggleRight className="h-6 w-6" />
                        ) : (
                          <ToggleLeft className="h-6 w-6" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditingProvider(provider)}
                        className="p-2 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteProvider(provider)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && <IntegrationsTab />}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free Key Settings */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-400" />
              Free Key Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm">Enable Free Keys</label>
                <button
                  onClick={() => setSettings(s => ({ 
                    ...s, 
                    free_key_enabled: s.free_key_enabled === 'true' ? 'false' : 'true' 
                  }))}
                  className={`p-1 rounded transition-colors ${
                    settings.free_key_enabled === 'true' ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {settings.free_key_enabled === 'true' ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Max Keys Per User</label>
                <input
                  type="number"
                  value={settings.max_keys_per_user}
                  onChange={(e) => setSettings(s => ({ ...s, max_keys_per_user: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Key Cooldown (hours)</label>
                <input
                  type="number"
                  value={settings.key_cooldown_hours}
                  onChange={(e) => setSettings(s => ({ ...s, key_cooldown_hours: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Premium Settings */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Premium Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-400 text-sm">Enable Premium</label>
                <button
                  onClick={() => setSettings(s => ({ 
                    ...s, 
                    premium_enabled: s.premium_enabled === 'true' ? 'false' : 'true' 
                  }))}
                  className={`p-1 rounded transition-colors ${
                    settings.premium_enabled === 'true' ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {settings.premium_enabled === 'true' ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Premium Price (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={settings.premium_price_usd}
                    onChange={(e) => setSettings(s => ({ ...s, premium_price_usd: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Premium Duration (days)</label>
                <input
                  type="number"
                  value={settings.premium_duration_days}
                  onChange={(e) => setSettings(s => ({ ...s, premium_duration_days: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 md:col-span-2">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              Additional Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-gray-400 text-sm">Require Discord Link</label>
                  <p className="text-gray-600 text-xs mt-0.5">Users must link Discord to get keys</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ 
                    ...s, 
                    require_discord_link: s.require_discord_link === 'true' ? 'false' : 'true' 
                  }))}
                  className={`p-1 rounded transition-colors ${
                    settings.require_discord_link === 'true' ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {settings.require_discord_link === 'true' ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">System Message</label>
                <textarea
                  value={settings.system_message}
                  onChange={(e) => setSettings(s => ({ ...s, system_message: e.target.value }))}
                  placeholder="Optional message shown on get-key page..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Provider Modal */}
      {(showAddModal || editingProvider) && (
        <ProviderModal
          provider={editingProvider}
          onSave={saveProvider}
          onClose={() => {
            setShowAddModal(false);
            setEditingProvider(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

// Provider Modal Component
interface ProviderModalProps {
  provider: KeyProvider | null;
  onSave: (provider: Partial<KeyProvider>) => void;
  onClose: () => void;
  saving: boolean;
}

function ProviderModal({ provider, onSave, onClose, saving }: ProviderModalProps) {
  const [form, setForm] = useState({
    provider_id: provider?.provider_id || '',
    name: provider?.name || '',
    description: provider?.description || '',
    icon: provider?.icon || '',
    color: provider?.color || '#00ff88',
    api_key: provider?.api_key || '',
    base_url: provider?.base_url || '',
    link_id: provider?.link_id || '',
    link_slug: (provider as any)?.link_slug || '', // Work.ink specific
    full_url: provider?.full_url || '',
    key_duration_days: provider?.key_duration_days || 1,
    is_active: provider?.is_active ?? false,
    is_premium: provider?.is_premium ?? false,
    priority: provider?.priority ?? 0
  });

  const isEdit = !!provider;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build full URL
    const fullUrl = form.full_url || `${form.base_url}${form.link_id}`;
    
    onSave({
      ...(provider?.id && { id: provider.id }),
      ...form,
      full_url: fullUrl
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h2 className="text-white font-semibold text-lg">
            {isEdit ? 'Edit Provider' : 'Add Provider'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Provider ID */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Provider ID *</label>
            <select
              value={form.provider_id}
              onChange={(e) => {
                const id = e.target.value;
                setForm(f => ({ 
                  ...f, 
                  provider_id: id,
                  icon: providerIcons[id] || '⚡'
                }));
              }}
              required
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Select provider...</option>
              <option value="linkvertise">Linkvertise</option>
              <option value="lootlabs">Loot Labs</option>
              <option value="workink">Work.ink</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Display Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Linkvertise"
              required
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Complete offer to get key"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Color & Icon */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm block mb-2 font-medium">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded border border-[#2a2a2a] cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2 font-medium">Icon (emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🔗"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Base URL *</label>
            <input
              type="url"
              value={form.base_url}
              onChange={(e) => setForm(f => ({ ...f, base_url: e.target.value }))}
              placeholder="https://work.ink"
              required
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Link ID & Slug (for Work.ink) */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                Link ID * 
                {form.provider_id === 'workink' && (
                  <span className="text-primary ml-1">(Required)</span>
                )}
              </label>
              <input
                type="text"
                value={form.link_id}
                onChange={(e) => setForm(f => ({ ...f, link_id: e.target.value }))}
                placeholder={form.provider_id === 'workink' ? 'e.g., 29Si' : '1234567'}
                required={form.provider_id === 'workink'}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
              />
              {form.provider_id === 'workink' && (
                <p className="text-xs text-gray-600 mt-1">Get from Work.ink Dashboard</p>
              )}
            </div>
            {form.provider_id === 'workink' && (
              <div>
                <label className="text-gray-400 text-sm block mb-2">
                  Link Slug * <span className="text-primary ml-1">(Required)</span>
                </label>
                <input
                  type="text"
                  value={form.link_slug || ''}
                  onChange={(e) => setForm(f => ({ ...f, link_slug: e.target.value }))}
                  placeholder="e.g., sixsense"
                  required
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-600 mt-1">URL path: work.ink/linkid/slug</p>
              </div>
            )}
          </div>

          {/* Work.ink Instructions */}
          {form.provider_id === 'workink' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-300 font-medium mb-2">Work.ink Setup:</p>
                  <ol className="text-blue-200/80 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://dashboard.work.ink" target="_blank" rel="noopener" className="text-primary hover:underline">Work.ink Dashboard</a></li>
                    <li>Navigate to <strong>For Developers → Key System</strong></li>
                    <li>Copy your <strong>API Key</strong> (starts with ff...)</li>
                    <li>Create an offer/link to get your <strong>Link ID</strong> (e.g., "29Si")</li>
                    <li>Set your custom <strong>Link Slug</strong> (e.g., "sixsense") for branding</li>
                  </ol>
                  <p className="text-yellow-400 mt-3 text-xs flex items-start gap-1">
                    <span>⚠️</span>
                    <span><strong>Required:</strong> API Key, Link ID, and Link Slug are all needed for Work.ink!</span>
                  </p>
                  <p className="text-gray-400 mt-2 text-xs">
                    Final URL format: <code className="bg-black/30 px-1 py-0.5 rounded">work.ink/[Link ID]/[Slug]</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full URL (optional override) */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Full URL (optional override)</label>
            <input
              type="url"
              value={form.full_url}
              onChange={(e) => setForm(f => ({ ...f, full_url: e.target.value }))}
              placeholder="Auto-generated from Base URL + Link ID"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-gray-600 text-xs mt-1">
              Preview: {form.full_url || `${form.base_url}${form.link_id}`}
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">
              API Key (for verification)
              {(form.provider_id === 'linkvertise' || form.provider_id === 'lootlabs' || form.provider_id === 'workink') && (
                <span className="text-red-400 ml-1">*</span>
              )}
            </label>
            <input
              type="password"
              value={form.api_key}
              onChange={(e) => setForm(f => ({ ...f, api_key: e.target.value }))}
              placeholder={
                form.provider_id === 'workink'
                  ? 'Get from dashboard.work.ink → Key System'
                  : form.provider_id === 'linkvertise' 
                  ? 'Get from Linkvertise dashboard' 
                  : form.provider_id === 'lootlabs'
                  ? 'Get from LootLabs dashboard'
                  : 'Provider API key...'
              }
              required={form.provider_id === 'linkvertise' || form.provider_id === 'lootlabs' || form.provider_id === 'workink'}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-gray-600 mt-1">
              {form.provider_id === 'workink' && (
                <>
                  Get from <a href="https://dashboard.work.ink/developer/key-system/manage" target="_blank" rel="noopener" className="text-primary hover:underline">Work.ink Dashboard → For Developers → Key System</a>
                </>
              )}
              {form.provider_id === 'linkvertise' && 'Required for Linkvertise offer verification'}
              {form.provider_id === 'lootlabs' && 'Required for LootLabs callback authentication'}
              {form.provider_id === 'custom' && 'Optional - depends on your provider'}
            </p>
          </div>

          {/* Key Duration & Priority */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-gray-400 text-sm block mb-2">Key Duration (days)</label>
              <input
                type="number"
                min="1"
                value={form.key_duration_days}
                onChange={(e) => setForm(f => ({ ...f, key_duration_days: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">Priority</label>
              <input
                type="number"
                min="0"
                value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:border-primary focus:outline-none"
              />
              <p className="text-gray-600 text-xs mt-1">Lower = higher on list</p>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0a] text-primary focus:ring-primary"
              />
              <span className="text-gray-400 text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_premium}
                onChange={(e) => setForm(f => ({ ...f, is_premium: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0a] text-primary focus:ring-primary"
              />
              <span className="text-gray-400 text-sm">Premium Provider</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-[#1a1a1a]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-400 hover:text-white text-sm font-medium transition-colors hover:bg-white/5 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 min-w-[120px] justify-center"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEdit ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Integrations Tab Component
function IntegrationsTab() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const integrationDocs = [
    {
      provider: 'Work.ink',
      providerId: 'workink',
      callbackUrl: `${baseUrl}/api/callback/workink`,
      webhookFormat: 'GET or POST',
      description: 'Platoboost gateway for Work.ink offers',
      setupSteps: [
        'Go to Work.ink dashboard → Settings → Webhooks',
        'Add new webhook endpoint',
        'Set URL to your callback URL',
        'Select "Offer Completed" event',
        'Save webhook configuration'
      ],
      expectedParams: {
        session: 'Session ID (passed in URL as ?sr=SESSION_ID)',
        token: 'Verification token (optional)',
        status: 'Completion status'
      }
    },
    {
      provider: 'Linkvertise',
      providerId: 'linkvertise',
      callbackUrl: `${baseUrl}/api/callback/linkvertise`,
      webhookFormat: 'POST JSON',
      description: 'Linkvertise monetization platform',
      setupSteps: [
        'Login to Linkvertise dashboard',
        'Navigate to Settings → API & Webhooks',
        'Create new API key (copy to provider config)',
        'Add webhook URL',
        'Enable "Link Visited" and "Offer Completed" events'
      ],
      expectedParams: {
        session: 'Session ID from URL parameter',
        user_id: 'User identifier',
        link_id: 'Linkvertise link ID',
        event: 'Event type (offer_completed)'
      }
    },
    {
      provider: 'Loot Labs',
      providerId: 'lootlabs',
      callbackUrl: `${baseUrl}/api/callback/lootlabs`,
      webhookFormat: 'POST JSON',
      description: 'Gaming monetization platform',
      setupSteps: [
        'Access Lootlabs publisher dashboard',
        'Go to Developer → Webhooks',
        'Add your callback URL',
        'Copy API key to provider configuration',
        'Test webhook with test offer'
      ],
      expectedParams: {
        session: 'Session tracking ID',
        user_id: 'Discord or user ID',
        offer_id: 'Completed offer ID',
        reward: 'Reward amount'
      }
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Provider Integration Setup
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Configure webhooks and callbacks for each monetization provider. Copy the callback URLs
          and add them to your provider dashboards.
        </p>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300 font-medium mb-1">
                How It Works (Luarmor-style)
              </p>
              <ol className="text-sm text-blue-200/80 space-y-1 list-decimal list-inside">
                <li>User clicks provider → Gets unique session ID</li>
                <li>User completes offer on provider site</li>
                <li>Provider sends webhook to your callback URL with session ID</li>
                <li>System auto-generates key and updates session</li>
                <li>Frontend polls every 5s and shows key when ready</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {integrationDocs.map((doc) => (
        <div 
          key={doc.providerId}
          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              {doc.provider}
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-md">
                {doc.providerId}
              </span>
            </h4>
            <span className="text-xs px-2 py-1 bg-[#1a1a1a] text-gray-400 rounded-md">
              {doc.webhookFormat}
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-4">{doc.description}</p>

          {/* Callback URL */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">
              Callback URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md text-primary text-sm font-mono">
                {doc.callbackUrl}
              </code>
              <button
                onClick={() => copyToClipboard(doc.callbackUrl)}
                className="px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-md text-gray-400 hover:text-white transition-colors"
                title="Copy URL"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Add this URL to {doc.provider} dashboard webhooks section
            </p>
          </div>

          {/* Setup Steps */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Setup Steps</label>
            <ol className="space-y-2">
              {doc.setupSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Expected Parameters */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Expected Parameters</label>
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-md p-3">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(doc.expectedParams).map(([key, value]) => (
                    <tr key={key} className="border-b border-[#1a1a1a] last:border-0">
                      <td className="py-2 pr-4 text-primary font-mono">{key}</td>
                      <td className="py-2 text-gray-400">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {/* Test Section */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-400" />
          Testing Your Integration
        </h4>
        <div className="space-y-2 text-sm text-gray-400">
          <p>1. Enable a provider in the Providers tab</p>
          <p>2. Visit /get-key and select the provider</p>
          <p>3. Click START - a session will be created</p>
          <p>4. Complete the offer on the provider site</p>
          <p>5. Check browser console and network tab for callback</p>
          <p>6. Key should appear automatically after ~5 seconds</p>
        </div>
      </div>
    </div>
  );
}
