'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Key,
  Webhook,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeveloperSettings() {
  const [keys, setKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [creatingKey, setCreatingKey] = useState(false);

  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  const [revealedSecrets, setRevealedSecrets] = useState({}); // To reveal webhook secrets

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/keys'),
        fetch('/api/webhooks'),
      ]);
      const keysData = await keysRes.json();
      const webhooksData = await webhooksRes.json();

      if (keysData.keys) setKeys(keysData.keys);
      if (webhooksData.webhooks) setWebhooks(webhooksData.webhooks);
    } catch (err) {
      toast.error('Failed to load developer settings');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return toast.error('Key name is required');

    setCreatingKey(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGeneratedKey(data.key);
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          maskedKey: 'sk_prod_...' + data.key.slice(-4),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success('API Key generated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteApiKey = async (id) => {
    if (
      !confirm(
        'Are you sure you want to revoke this key? Any integrations using it will immediately fail.'
      )
    )
      return;
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete key');
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success('API Key revoked');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const createWebhook = async (e) => {
    e.preventDefault();
    if (!newWebhookUrl.trim() || !newWebhookUrl.startsWith('https://')) {
      return toast.error('A valid HTTPS URL is required');
    }

    setCreatingWebhook(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newWebhookUrl, events: ['*'] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWebhooks((prev) => [data.webhook, ...prev]);
      setIsWebhookModalOpen(false);
      setNewWebhookUrl('');
      toast.success('Webhook endpoint added');
    } catch (err) {
      toast.error(err.message || 'Failed to create webhook');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm('Are you sure you want to remove this webhook?')) return;
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      toast.success('Webhook removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleSecret = (id) => {
    setRevealedSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Developer & Integrations
        </h2>
        <p className="text-neutral-secondary mt-1">
          Manage API keys and Webhook endpoints for programmatic access.
        </p>
      </div>

      {/* API Keys Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-400" />
              API Keys
            </h3>
            <p className="text-sm text-neutral-400">
              Generate cryptographic keys for external access.
            </p>
          </div>
          <Button
            onClick={() => {
              setIsKeyModalOpen(true);
              setGeneratedKey(null);
              setNewKeyName('');
            }}
            variant="primary"
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Create Key
          </Button>
        </div>

        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 divide-y divide-white/[0.05]">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No API keys generated yet.</div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{key.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-mono">
                      {key.maskedKey}
                    </code>
                    <span className="text-xs text-neutral-500">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => deleteApiKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Webhooks Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Webhook className="h-5 w-5 text-orange-400" />
              Webhooks
            </h3>
            <p className="text-sm text-neutral-400">
              Configure event notifications to external systems.
            </p>
          </div>
          <Button onClick={() => setIsWebhookModalOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add Endpoint
          </Button>
        </div>

        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 divide-y divide-white/[0.05]">
          {webhooks.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No webhook endpoints configured.</div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="font-medium text-white truncate flex items-center gap-2">
                      {webhook.url}
                      {webhook.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">
                          Failing
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Events:{' '}
                      {Array.isArray(webhook.events)
                        ? webhook.events.join(', ')
                        : JSON.parse(webhook.events || '[]').join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    onClick={() => deleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pt-3 border-t border-white/[0.05]">
                  <div className="text-xs text-neutral-400 mb-1">Signing Secret</div>
                  <div className="flex items-center gap-2 max-w-md">
                    <code className="flex-1 px-3 py-1.5 bg-black/40 border border-white/10 rounded font-mono text-xs truncate">
                      {revealedSecrets[webhook.id] ? webhook.secret : 'whsec_' + '•'.repeat(24)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400"
                      onClick={() => toggleSecret(webhook.id)}
                    >
                      {revealedSecrets[webhook.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400"
                      onClick={() => copyToClipboard(webhook.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </section>

      {/* Create Key Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => {
          if (!generatedKey) setIsKeyModalOpen(false);
        }}
        title={generatedKey ? 'Key Generated' : 'Create API Key'}
        maxWidth="max-w-lg"
      >
        {generatedKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div className="text-sm text-green-100">
                <p className="font-medium text-green-400">Save this key now</p>
                <p className="mt-1">
                  This is the only time you will see this key. If you lose it, you will need to
                  generate a new one.
                </p>
              </div>
            </div>
            <div className="relative">
              <code className="block w-full p-4 bg-black/50 border border-white/10 rounded-xl font-mono text-sm text-white break-all">
                {generatedKey}
              </code>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(generatedKey)}
              >
                Copy
              </Button>
            </div>
            <Button className="w-full" onClick={() => setIsKeyModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={createApiKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Key Name</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Environment"
                autoFocus
              />
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200/80">
                API keys grant full access to your account's programmatic resources. Treat them like
                passwords.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsKeyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creatingKey || !newKeyName.trim()}>
                {creatingKey ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Webhook Modal */}
      <Modal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        title="Add Webhook Endpoint"
      >
        <form onSubmit={createWebhook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Endpoint URL</label>
            <Input
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/webhook"
              type="url"
              autoFocus
            />
            <p className="text-xs text-neutral-500 mt-1.5">Must be a secure HTTPS endpoint.</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setIsWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creatingWebhook || !newWebhookUrl.trim()}
            >
              {creatingWebhook ? 'Adding...' : 'Add Endpoint'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
