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
import { Key, Plus, Trash2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState(null); // The raw key shown once
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');

      setCreatedKey(data.key);
      setNewKeyName('');
      // Add to list (without raw key)
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          maskedKey: 'sk_prod_...' + data.key.slice(-4),
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        },
        ...prev,
      ]);

      toast.success('API Key created');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id) => {
    if (
      !confirm(
        'Are you sure you want to revoke this API key? This action cannot be undone and any applications using it will immediately lose access.'
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

  const copyToClipboard = (text, id = null) => {
    navigator.clipboard.writeText(text);
    if (id === 'new') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreatedKey(null);
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
          <h2 className="text-2xl font-semibold tracking-tight text-white">API Keys</h2>
          <p className="text-neutral-secondary mt-1">
            Manage your API keys to access DevineDesk services programmatically.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Create Secret Key
        </Button>
      </div>

      <Card className="border-neutral-border-glass bg-neutral-card-bg/50 overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-neutral-400">
              <Key size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">No API keys yet</h3>
            <p className="text-neutral-400 mt-1 max-w-sm">
              Create an API key to authenticate your requests to the DevineDesk API.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              Create First Key
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Secret Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium text-white">{key.name}</TableCell>
                  <TableCell className="font-mono text-neutral-400 text-xs">
                    {key.maskedKey}
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => deleteKey(key.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={createdKey ? null : closeCreateModal}
        title={createdKey ? 'Save your API Key' : 'Create new secret key'}
        maxWidth="max-w-md"
      >
        {createdKey ? (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-yellow-500/90">
                Please save this secret key somewhere safe and accessible. For security reasons,{' '}
                <strong>you won't be able to view it again</strong> through your DevineDesk account.
                If you lose this secret key, you'll need to generate a new one.
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={createdKey}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-12 font-mono text-sm text-primary focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(createdKey, 'new')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>

            <Button variant="primary" className="w-full" onClick={closeCreateModal}>
              I have saved my key
            </Button>
          </div>
        ) : (
          <form onSubmit={createKey} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Name</label>
              <Input
                autoFocus
                placeholder="e.g. Production Web App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creating || !newKeyName.trim()}>
                {creating ? 'Creating...' : 'Create secret key'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
