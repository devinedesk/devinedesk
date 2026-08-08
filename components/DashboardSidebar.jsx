'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BarChart,
  CreditCard,
  Settings,
  Users,
  Shield,
  Activity,
  Box,
  LifeBuoy,
  Server,
  Database,
  MonitorPlay,
  Wallet,
  Gauge,
  CheckSquare,
  List,
} from 'lucide-react';
import clsx from 'clsx';
import { NotificationBell } from './NotificationBell';

const navGroups = [
  {
    title: 'General',
    items: [
      { name: 'Overview', href: '/dashboard', icon: Home, dataTour: 'sidebar-overview' },
      { name: 'AI Studio', href: '/dashboard/ai', icon: Box, dataTour: 'sidebar-ai' },
      { name: 'History', href: '/dashboard/history', icon: Activity, dataTour: 'sidebar-history' },
      { name: 'Explore', href: '/explore', icon: MonitorPlay, dataTour: 'sidebar-explore' },
    ],
  },
  {
    title: 'Analytics & Finance',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
      {
        name: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
        dataTour: 'sidebar-billing',
      },
    ],
  },
  {
    title: 'System & Settings',
    items: [
      { name: 'Admin Portal', href: '/admin', icon: Shield },
      { name: 'Settings', href: '/settings/account', icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-neutral-panel-bg border-r border-neutral-border-glass tour-step-sidebar">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-neutral-border-glass">
        <Link href="/" className="flex items-center gap-2" data-tour="omnibar">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">devinedesk</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="px-3">
              <h4 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-tour={item.dataTour}
                      className={clsx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-neutral-secondary hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          isActive ? 'text-primary' : 'text-neutral-muted group-hover:text-white'
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto border-t border-neutral-border-glass">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3 border border-neutral-border-glass">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-full bg-neutral-muted overflow-hidden flex shrink-0 items-center justify-center">
              <Users className="h-5 w-5 text-white/70" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-medium text-white truncate max-w-[100px]">
                User Account
              </span>
              <span className="text-xs text-neutral-secondary truncate max-w-[100px]">
                Pro Plan
              </span>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}
