'use client';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Briefcase, Loader2, Plus, Users, Shield, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

export default function WorkspaceSettings() {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wsRes, orgsRes] = await Promise.all([
        fetch('/api/workspaces'),
        fetch('/api/organizations'),
      ]);

      const wsData = await wsRes.json();
      const orgsData = await orgsRes.json();

      if (wsRes.ok && wsData.workspaces) {
        setWorkspaces(wsData.workspaces);
        if (wsData.workspaces.length > 0) setActiveWorkspace(wsData.workspaces[0]);
      }

      if (orgsRes.ok && orgsData.organizations) {
        setOrganizations(orgsData.organizations);
        if (orgsData.organizations.length > 0) setSelectedOrgId(orgsData.organizations[0].id);
      }
    } catch (err) {
      toast.error('Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return toast.error('Workspace name is required');
    if (!selectedOrgId) return toast.error('Must select an organization');

    setCreating(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName, organizationId: selectedOrgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWorkspaces((prev) => [data.workspace, ...prev]);
      if (!activeWorkspace) setActiveWorkspace(data.workspace);

      toast.success('Workspace created successfully');
      setIsCreateModalOpen(false);
      setNewWorkspaceName('');
    } catch (err) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Workspaces</h2>
          <p className="text-neutral-secondary mt-1">
            Manage your project workspaces and team access.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" className="gap-2">
          <Plus className="h-4 w-4" /> New Workspace
        </Button>
      </div>

      {!activeWorkspace ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/20">
          <Briefcase className="h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium text-white">No Workspaces</h3>
          <p className="text-neutral-400 mt-2">Create your first workspace to get started.</p>
          <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="mt-6">
            Create Workspace
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setActiveWorkspace(ws)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeWorkspace.id === ws.id
                    ? 'bg-primary text-black'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {ws.name}
              </button>
            ))}
          </div>

          <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{activeWorkspace.name}</h3>
                  <p className="text-sm text-neutral-400">
                    Belongs to: {activeWorkspace.organization?.name || 'Unknown Org'}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Workspace ID</div>
                <div className="text-sm text-neutral-300 font-mono">{activeWorkspace.slug}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Created</div>
                <div className="text-sm text-white font-medium">
                  {new Date(activeWorkspace.createdAt || new Date()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Workspace Members
                </h3>
                <p className="text-sm text-neutral-400">
                  People with access to this specific workspace.
                </p>
              </div>
            </div>

            <Card className="border-neutral-border-glass bg-neutral-card-bg/50 divide-y divide-white/[0.05]">
              {activeWorkspace.members?.map((member) => (
                <div
                  key={member.userId}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10">
                      {member.user?.image ? (
                        <Image
                          src={member.user.image}
                          alt={member.user?.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg text-neutral-500">
                          {member.user?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {member.user?.name || 'Unknown User'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium text-neutral-300">
                      {member.role === 'ADMIN' && <Shield className="h-3 w-3 text-primary" />}
                      {member.role}
                    </div>
                    {member.role !== 'ADMIN' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(!activeWorkspace.members || activeWorkspace.members.length === 0) && (
                <div className="p-4 text-neutral-500 text-sm">
                  No members found for this workspace.
                </div>
              )}
            </Card>
          </section>
        </>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Organization</label>
            <select
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select an Organization
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {organizations.length === 0 && (
              <p className="text-xs text-red-400 mt-1">
                You must be a member of an Organization to create a workspace.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Workspace Name
            </label>
            <Input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. Q3 Marketing Campaign"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creating || !newWorkspaceName.trim() || !selectedOrgId}
            >
              {creating ? 'Creating...' : 'Create Workspace'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
