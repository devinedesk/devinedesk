'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  CreditCard,
  Box,
  LifeBuoy,
  Zap,
  LayoutDashboard,
  Compass,
  Settings,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const commands = [
  {
    id: 'dashboard',
    name: 'Dashboard Home',
    icon: LayoutDashboard,
    href: '/dashboard',
    category: 'Navigation',
  },
  { id: 'explore', name: 'Marketplace', icon: Compass, href: '/explore', category: 'Navigation' },
  { id: 'workflows', name: 'My Workflows', icon: Zap, href: '/dashboard', category: 'Navigation' },
  {
    id: 'billing',
    name: 'Billing & Credits',
    icon: CreditCard,
    href: '/dashboard/billing',
    category: 'Settings',
  },
  {
    id: 'profile',
    name: 'Profile & Settings',
    icon: Settings,
    href: '/settings/profile',
    category: 'Settings',
  },
  {
    id: 'workspace',
    name: 'Workspace Settings',
    icon: Box,
    href: '/settings/workspace',
    category: 'Settings',
  },
  {
    id: 'support',
    name: 'Help Center',
    icon: LifeBuoy,
    href: '/dashboard/support',
    category: 'Support',
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

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

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  // Add the dynamic "Sign Out" action if it matches or if search is empty
  const allResults = [
    ...filteredCommands,
    ...('sign out'.includes(query.toLowerCase())
      ? [
          {
            id: 'signout',
            name: 'Sign Out',
            icon: LogOut,
            action: () => signOut(),
            category: 'Actions',
          },
        ]
      : []),
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % allResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + allResults.length) % allResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          executeCommand(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, allResults]);

  const executeCommand = (cmd) => {
    setOpen(false);
    if (cmd.action) {
      cmd.action();
    } else if (cmd.href) {
      router.push(cmd.href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4 sm:px-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      ></div>

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-border-glass shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-neutral-border-glass/50">
          <Search className="h-5 w-5 text-neutral-secondary mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 text-white placeholder-neutral-500 focus:outline-none text-lg"
            placeholder="What do you need?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs text-neutral-500 font-mono tracking-widest uppercase ml-2 bg-neutral-800 px-2 py-1 rounded">
            ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {allResults.length === 0 ? (
            <div className="px-6 py-12 text-center text-neutral-secondary">
              No results found for "{query}"
            </div>
          ) : (
            allResults.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center px-4 py-3 mx-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary' : 'text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mr-3 ${isSelected ? 'text-primary' : 'text-neutral-500'}`}
                  />
                  <span className="flex-1 font-medium">{cmd.name}</span>
                  <span
                    className={`text-xs ${isSelected ? 'text-primary/70' : 'text-neutral-600'}`}
                  >
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
