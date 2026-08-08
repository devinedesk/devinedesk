'use client';

import { Card } from '@/components/ui/Card';
import { Box, Plus, Users, Settings as SettingsIcon, Building, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wsRes, orgRes] = await Promise.all([
        fetch('/api/workspaces'),
        fetch('/api/organizations'),
      ]);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkspaces(wsData.workspaces || []);
      }
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        const orgs = orgData.organizations || [];
        setOrganizations(orgs);
        if (orgs.length > 0) {
          // Pre-select first org where user is OWNER or ADMIN
          const adminOrg = orgs.find((o) =>
            o.members.some((m) => m.role === 'OWNER' || m.role === 'ADMIN')
          );
          setSelectedOrgId(adminOrg ? adminOrg.id : orgs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName || !selectedOrgId) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkspaceName,
          organizationId: selectedOrgId,
        }),
      });

      if (res.ok) {
        toast.success('Workspace created!');
        setNewWorkspaceName('');
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create workspace.');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-neutral-secondary mt-2">Manage your isolated environments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-black font-semibold rounded-xl px-4 py-2 flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Workspace
        </button>
      </div>

      {loading ? (
        <div className="text-neutral-secondary animate-pulse py-8">Loading workspaces...</div>
      ) : workspaces.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-neutral-border-glass rounded-2xl bg-neutral-card-bg/20">
          <Box className="h-12 w-12 text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Workspaces Found</h3>
          <p className="text-sm text-neutral-secondary mb-6 max-w-md">
            You don&apos;t belong to any workspaces yet. Create one to get started building isolated
            environments.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <Card
              key={ws.id}
              className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md cursor-pointer hover:border-white/20 transition-colors flex flex-col h-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Box className="h-6 w-6 text-white/70" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-secondary">
                  <Building className="h-3 w-3" /> {ws.organization?.name}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{ws.name}</h3>
              <p className="text-xs font-mono text-neutral-secondary mb-6">ID: {ws.slug}</p>

              <div className="flex items-center gap-4 text-sm text-neutral-secondary border-t border-neutral-border-glass pt-4 mt-auto">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {ws.members?.length || 0} Member(s)
                </span>
                <Link
                  href="/settings/organization"
                  className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto"
                >
                  <SettingsIcon className="h-4 w-4" /> Manage
                </Link>
              </div>
            </Card>
          ))}

          <Card
            onClick={() => setIsModalOpen(true)}
            className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 backdrop-blur-md cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all border-dashed flex flex-col items-center justify-center text-center min-h-[240px]"
          >
            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center border border-neutral-border-glass mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6 text-neutral-secondary" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Create Workspace</h3>
            <p className="text-sm text-neutral-secondary">Add a new isolated environment</p>
          </Card>
        </div>
      )}

      {/* CREATE WORKSPACE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md border-neutral-border-glass bg-neutral-900 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-secondary hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create New Workspace</h2>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-secondary mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Production Environment"
                  required
                  className="w-full bg-black/40 border border-neutral-border-glass rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-secondary mb-2">
                  Parent Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-neutral-border-glass rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-2">
                  You must be an Admin or Owner of the organization to create a workspace.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-primary hover:bg-primary-hover text-black font-semibold rounded-xl px-6 py-2.5 transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
