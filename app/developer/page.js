'use client';

import { Card } from '@/components/ui/Card';
import { Key, Webhook, Code, Activity, Copy, Eye, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import clsx from 'clsx';

export default function DeveloperPage() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Webhook Modal State
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['workflow.completed', 'workflow.failed']);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchKeys(), fetchWebhooks()]);
    setLoading(false);
  };

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKey = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Production Key ' + (keys.length + 1) }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id) => {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    setIsCreatingWebhook(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
      });
      if (res.ok) {
        setWebhookUrl('');
        setIsWebhookModalOpen(false);
        fetchWebhooks();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create webhook');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWebhooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Developer Tools</h1>
          <p className="text-neutral-secondary mt-2">
            Manage API keys, webhooks, and integrate with your own applications.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/docs/api"
            className="bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl px-4 py-2 border border-neutral-border-glass transition-colors flex items-center gap-2"
          >
            <Code className="h-4 w-4" /> API Docs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-border-glass flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-white">API Keys</h3>
            </div>
            <button
              onClick={handleCreateKey}
              disabled={isCreating}
              className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> {isCreating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {newKey && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-green-400 mb-2">
                  New API Key Created! Copy it now, you won&apos;t see it again.
                </p>
                <div className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-green-500/20">
                  <code className="text-xs text-white break-all">{newKey}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newKey)}
                    className="text-neutral-secondary hover:text-white p-1"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <p className="text-neutral-secondary text-sm">Loading keys...</p>
              ) : keys.length === 0 ? (
                <p className="text-neutral-secondary text-sm">No API keys generated yet.</p>
              ) : (
                keys.map((k) => (
                  <div
                    key={k.id}
                    className="bg-white/5 border border-neutral-border-glass rounded-xl p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{k.name}</p>
                      <p className="text-xs text-neutral-secondary font-mono mt-1">{k.maskedKey}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="h-8 w-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-neutral-secondary hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-border-glass flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Webhooks</h3>
            </div>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Endpoint
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="space-y-4">
              {loading ? (
                <p className="text-neutral-secondary text-sm">Loading webhooks...</p>
              ) : webhooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-neutral-border-glass mb-4">
                    <Webhook className="h-6 w-6 text-neutral-secondary" />
                  </div>
                  <p className="text-sm text-neutral-secondary max-w-sm mb-4">
                    Listen to generation events, payment updates, and user activities in real-time.
                  </p>
                  <button
                    onClick={() => setIsWebhookModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-4 py-2 border border-white/10 transition-colors"
                  >
                    Configure Webhooks
                  </button>
                </div>
              ) : (
                webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="bg-white/5 border border-neutral-border-glass rounded-xl p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${wh.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {wh.url}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="h-8 w-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-neutral-secondary hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(wh.events || '[]').map((ev) => (
                        <span
                          key={ev}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between bg-black/50 p-2 rounded-lg border border-white/5 mt-1">
                      <code className="text-xs text-neutral-secondary break-all flex-1 select-all">
                        {wh.secret}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(wh.secret)}
                        className="text-neutral-secondary hover:text-white p-1 ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md overflow-hidden">
        <div className="p-6 border-b border-neutral-border-glass flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Recent API Requests</h3>
          </div>
          <Link
            href="/dashboard/analytics"
            className="text-sm text-neutral-secondary hover:text-white transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="p-6 text-center text-neutral-secondary text-sm">
          No API requests in the last 24 hours.
        </div>
      </Card>

      {/* Webhook Modal */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-neutral-border-glass rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2">Add Webhook Endpoint</h2>
            <p className="text-sm text-neutral-secondary mb-6">
              Receive real-time HTTP POST requests when events occur.
            </p>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Payload URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.yourdomain.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-border-glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Events</label>
                <div className="bg-black/50 border border-neutral-border-glass rounded-xl p-3 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes('workflow.completed')}
                      onChange={(e) => {
                        if (e.target.checked)
                          setWebhookEvents([...webhookEvents, 'workflow.completed']);
                        else
                          setWebhookEvents(
                            webhookEvents.filter((ev) => ev !== 'workflow.completed')
                          );
                      }}
                      className="rounded border-neutral-600 bg-neutral-800 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-300">workflow.completed</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes('workflow.failed')}
                      onChange={(e) => {
                        if (e.target.checked)
                          setWebhookEvents([...webhookEvents, 'workflow.failed']);
                        else
                          setWebhookEvents(webhookEvents.filter((ev) => ev !== 'workflow.failed'));
                      }}
                      className="rounded border-neutral-600 bg-neutral-800 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-300">workflow.failed</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl px-4 py-3 border border-neutral-border-glass transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingWebhook || !webhookUrl}
                  className="flex-1 bg-primary hover:bg-primary-hover text-black font-semibold rounded-xl px-4 py-3 transition-colors disabled:opacity-50"
                >
                  {isCreatingWebhook ? 'Saving...' : 'Save Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
