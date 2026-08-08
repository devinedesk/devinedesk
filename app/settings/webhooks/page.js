'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Webhook, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_EVENTS = [
  { id: 'generation.completed', label: 'Generation Completed' },
  { id: 'generation.failed', label: 'Generation Failed' },
  { id: 'workflow.started', label: 'Workflow Started' },
  { id: 'workflow.completed', label: 'Workflow Completed' },
];

export default function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState(['generation.completed']);
  const [creating, setCreating] = useState(false);

  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (err) {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (e) => {
    e.preventDefault();
    if (!newUrl.trim() || selectedEvents.length === 0) return;

    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: selectedEvents }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create webhook');

      setWebhooks((prev) => [data.webhook, ...prev]);
      setNewUrl('');
      setSelectedEvents(['generation.completed']);
      setIsCreateModalOpen(false);

      toast.success('Webhook endpoint created');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id) => {
    if (
      !confirm(
        'Are you sure you want to delete this webhook? It will stop receiving events immediately.'
      )
    )
      return;

    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete webhook');

      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      toast.success('Webhook deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEvent = (eventId) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Webhooks</h2>
          <p className="text-neutral-secondary mt-1">
            Receive real-time HTTP POST requests when events occur in your workspace.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Endpoint
        </Button>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
        {webhooks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-neutral-400">
              <Webhook size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">No webhooks configured</h3>
            <p className="text-neutral-400 mt-1 max-w-sm">
              Add an endpoint to start receiving events for generations, workflows, and more.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              Add First Endpoint
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Signing Secret</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => {
                const events = JSON.parse(webhook.events || '[]');
                return (
                  <TableRow key={webhook.id}>
                    <TableCell
                      className="font-medium text-white max-w-[200px] truncate"
                      title={webhook.url}
                    >
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {events.slice(0, 2).map((e) => (
                          <span
                            key={e}
                            className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider bg-white/10 text-neutral-300"
                          >
                            {e.split('.')[1] || e}
                          </span>
                        ))}
                        {events.length > 2 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-neutral-400">
                            +{events.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-neutral-400 text-xs">
                          {webhook.secret.substring(0, 12)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(webhook.secret, webhook.id)}
                          className="p-1 text-neutral-500 hover:text-white transition-colors"
                          title="Copy Secret"
                        >
                          {copiedId === webhook.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />{' '}
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-neutral-500">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !creating && setIsCreateModalOpen(false)}
        title="Add Webhook Endpoint"
        maxWidth="max-w-lg"
      >
        <form onSubmit={createWebhook} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Endpoint URL</label>
            <Input
              autoFocus
              type="url"
              placeholder="https://your-domain.com/webhook"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-500">Must be a valid HTTPS URL.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-200">Events to send</label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-1">
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    selectedEvents.includes(event.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        selectedEvents.includes(event.id)
                          ? 'bg-primary border-primary text-black'
                          : 'border-neutral-500'
                      }`}
                    >
                      {selectedEvents.includes(event.id) && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white">{event.label}</div>
                    <div className="font-mono text-xs text-neutral-500 mt-0.5">{event.id}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-2">
                <AlertCircle size={12} /> Please select at least one event.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creating || !newUrl.trim() || selectedEvents.length === 0}
            >
              {creating ? 'Adding...' : 'Add Endpoint'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
