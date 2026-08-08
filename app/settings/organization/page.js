'use client';
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building, Users, Mail, Loader2, Plus, Shield, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

export default function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations');
      const data = await res.json();
      if (res.ok && data.organizations?.length > 0) {
        setOrganizations(data.organizations);
        setActiveOrg(data.organizations[0]);
      }
    } catch (err) {
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      return toast.error('Please enter a valid email address');
    }

    setInviting(true);
    try {
      const res = await fetch('/api/organizations/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: activeOrg.id,
          email: inviteEmail,
          role: 'MEMBER',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setIsInviteModalOpen(false);
        setInviteEmail('');
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (err) {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building className="h-12 w-12 text-neutral-600 mb-4" />
        <h3 className="text-xl font-medium text-white">No Organization Found</h3>
        <p className="text-neutral-400 mt-2">You are not a member of any organizations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Organization</h2>
        <p className="text-neutral-secondary mt-1">
          Manage your team members and workspace settings.
        </p>
      </div>

      <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Organization Profile</h3>
              <p className="text-sm text-neutral-400">
                Configure your organization details and branding.
              </p>
            </div>
          </div>
          <Button variant="outline">Edit Details</Button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Organization Name</div>
            <div className="text-sm text-white font-medium">{activeOrg.name}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Organization Slug</div>
            <div className="text-sm text-white font-medium">{activeOrg.slug}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Created</div>
            <div className="text-sm text-white font-medium">
              {new Date(activeOrg.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </h3>
            <p className="text-sm text-neutral-400">Invite new members and manage their roles.</p>
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)} variant="primary" className="gap-2">
            <Plus className="h-4 w-4" /> Invite Member
          </Button>
        </div>

        <Card className="border-neutral-border-glass bg-neutral-card-bg/50 divide-y divide-white/[0.05]">
          {activeOrg.members?.map((member) => (
            <div
              key={member.id}
              className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10">
                  {member.user.image ? (
                    <Image
                      src={member.user.image}
                      alt={member.user.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-neutral-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{member.user.name || 'Unknown User'}</div>
                  <div className="text-sm text-neutral-500">{member.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs font-medium text-neutral-300">
                  {member.role === 'OWNER' && <Shield className="h-3 w-3 text-yellow-500" />}
                  {member.role}
                </div>
                {member.role !== 'OWNER' && (
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
        </Card>
      </section>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-500" />
              </div>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Role</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
              <option value="MEMBER">Member (Standard Access)</option>
              <option value="ADMIN">Admin (Full Access)</option>
              <option value="VIEWER">Viewer (Read Only)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={inviting || !inviteEmail.trim()}>
              {inviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
