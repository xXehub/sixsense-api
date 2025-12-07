'use client';

import { useState } from 'react';
import { 
  Settings, Save, Globe, Shield, Bell, Database, Key, Webhook,
  ToggleLeft, ToggleRight, Eye, EyeOff, RefreshCw, Copy, Check
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [settings, setSettings] = useState({
    siteName: 'sixsense',
    scriptVersion: '2.0.0',
    maintenanceMode: false,
    requireVerification: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    twoFactorEnabled: false,
    emailNotifications: true,
    discordNotifications: true,
    slackNotifications: false,
    apiKey: 'xxxx',
    webhookUrl: 'xxx',
  });

  const tabs = [
    { key: 'general', label: 'General', icon: Globe },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'api', label: 'API Keys', icon: Key },
  ];

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure system settings and preferences</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">v2.0.0</p>
            <p className="text-xs text-gray-500">Version</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary">
            <Shield className="h-4 w-4 text-black" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Active</p>
            <p className="text-xs text-gray-500">Security</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500">
            <Database className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Healthy</p>
            <p className="text-xs text-gray-500">Database</p>
          </div>
        </div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-4 flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500">
            <Webhook className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">2</p>
            <p className="text-xs text-gray-500">Webhooks</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex gap-6">
        {/* Tabs Navigation */}
        <div className="w-56 shrink-0">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-md p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-black'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-[#111] border border-[#1a1a1a] rounded-md">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#1a1a1a] pb-4">
                <h3 className="text-base font-semibold text-white">General Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Basic application configuration</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Script Version</label>
                  <input
                    type="text"
                    value={settings.scriptVersion}
                    onChange={(e) => setSettings({ ...settings, scriptVersion: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-sm font-medium text-white">Maintenance Mode</p>
                    <p className="text-xs text-gray-500 mt-0.5">Enable to temporarily disable the service</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                    className={`p-1 rounded-md transition-colors ${settings.maintenanceMode ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.maintenanceMode ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#1a1a1a] pb-4">
                <h3 className="text-base font-semibold text-white">Security Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Configure security and authentication</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Require Verification</p>
                    <p className="text-xs text-gray-500 mt-0.5">Users must verify their account</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, requireVerification: !settings.requireVerification })}
                    className={`p-1 rounded-md transition-colors ${settings.requireVerification ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.requireVerification ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500 mt-0.5">Require 2FA for admin accounts</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, twoFactorEnabled: !settings.twoFactorEnabled })}
                    className={`p-1 rounded-md transition-colors ${settings.twoFactorEnabled ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.twoFactorEnabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#1a1a1a]">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (hours)</label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#1a1a1a] pb-4">
                <h3 className="text-base font-semibold text-white">Notification Settings</h3>
                <p className="text-sm text-gray-400 mt-1">Configure notification channels</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Email Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Receive updates via email</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                    className={`p-1 rounded-md transition-colors ${settings.emailNotifications ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.emailNotifications ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-sm font-medium text-white">Discord Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Send alerts to Discord webhook</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, discordNotifications: !settings.discordNotifications })}
                    className={`p-1 rounded-md transition-colors ${settings.discordNotifications ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.discordNotifications ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-[#1a1a1a]">
                  <div>
                    <p className="text-sm font-medium text-white">Slack Notifications</p>
                    <p className="text-xs text-gray-500 mt-0.5">Send alerts to Slack channel</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, slackNotifications: !settings.slackNotifications })}
                    className={`p-1 rounded-md transition-colors ${settings.slackNotifications ? 'text-primary' : 'text-gray-500'}`}
                  >
                    {settings.slackNotifications ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                  </button>
                </div>

                <div className="pt-3 border-t border-[#1a1a1a]">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Webhook URL</label>
                  <input
                    type="text"
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* API Keys Settings */}
          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <div className="border-b border-[#1a1a1a] pb-4">
                <h3 className="text-base font-semibold text-white">API Keys</h3>
                <p className="text-sm text-gray-400 mt-1">Manage your API keys and access</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Live API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md">
                      <code className="text-sm text-gray-400 font-mono flex-1">
                        {showApiKey ? settings.apiKey : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={copyApiKey}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <button className="p-2.5 bg-[#1a1a1a] border border-[#222] rounded-md text-gray-400 hover:text-white transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Use this key for production API requests</p>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <p className="text-sm text-amber-400 font-medium">Security Warning</p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    Never share your API keys in public repositories or client-side code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
