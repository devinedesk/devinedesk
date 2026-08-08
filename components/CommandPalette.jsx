'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Home,
  CreditCard,
  Box,
  Settings,
  Users,
  Shield,
  LifeBuoy,
  Zap,
  ShieldAlert,
  Activity,
  DollarSign,
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm pt-[20vh] flex justify-center">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <Command label="Global Command Menu" className="flex flex-col h-full w-full">
          <div className="flex items-center border-b border-white/10 px-4">
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full bg-transparent border-0 h-14 text-white text-[15px] placeholder-white/40 focus:ring-0 focus:outline-none"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-white/50">
              No results found.
            </Command.Empty>

            <Command.Group
              heading={
                <div className="px-2 py-1 text-xs font-medium text-white/40">Navigation</div>
              }
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Home className="w-4 h-4 text-white/50" />
                Dashboard Overview
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/ai'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Zap className="w-4 h-4 text-primary" />
                New AI Generation
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/assets'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Box className="w-4 h-4 text-white/50" />
                My Assets
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading={
                <div className="px-2 py-1 mt-2 text-xs font-medium text-white/40">
                  Account & Billing
                </div>
              }
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/billing'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Manage Billing & Credits
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/settings/team'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-400" />
                Manage Team
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/security'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Shield className="w-4 h-4 text-orange-400" />
                Security Settings
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading={<div className="px-2 py-1 mt-2 text-xs font-medium text-white/40">Help</div>}
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/dashboard/support'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4 text-white/50" />
                Contact Support
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/settings/profile'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 rounded-xl aria-selected:bg-white/10 aria-selected:text-white cursor-pointer"
              >
                <Settings className="w-4 h-4 text-white/50" />
                General Settings
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading={
                <div className="px-2 py-1 mt-2 text-xs font-medium text-red-400/80">
                  Super Admin
                </div>
              }
            >
              <Command.Item
                onSelect={() => runCommand(() => router.push('/admin/security'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-100/80 rounded-xl aria-selected:bg-red-500/20 aria-selected:text-white cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Security Command Center
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/admin/health'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-cyan-100/80 rounded-xl aria-selected:bg-cyan-500/20 aria-selected:text-white cursor-pointer"
              >
                <Activity className="w-4 h-4 text-cyan-500" />
                System Health & Metrics
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push('/admin/usage'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-green-100/80 rounded-xl aria-selected:bg-green-500/20 aria-selected:text-white cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-green-500" />
                Cost & Usage Analytics
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
