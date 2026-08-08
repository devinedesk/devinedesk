'use client';

import DashboardLayout from '../dashboard/layout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  User,
  Shield,
  Palette,
  Bell,
  CreditCard,
  Users,
  Puzzle,
  Code,
  Activity,
  AlertTriangle,
  Building,
  Globe,
  Clock,
  Key,
  Smartphone,
  Lock,
  FileText,
  Database,
  Bot,
  Webhook,
  Zap,
  ShieldCheck,
  Mail,
  MessageSquare,
  HardDrive,
  Download,
  Upload,
  FlaskConical,
  Settings,
} from 'lucide-react';

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  const settingsGroups = [
    {
      title: 'Account & Security',
      items: [
        { name: 'Profile', href: '/settings/account', icon: User },
        { name: 'Security & 2FA', href: '/settings/security', icon: ShieldCheck },
        { name: 'Password', href: '/settings/password', icon: Key },
        { name: 'Passkeys', href: '/settings/passkeys', icon: Smartphone },
        { name: 'Sessions', href: '/settings/sessions', icon: Clock },
        { name: 'Devices', href: '/settings/devices', icon: Smartphone },
        { name: 'Privacy', href: '/settings/privacy', icon: Shield },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { name: 'Theme', href: '/settings/theme', icon: Palette },
        { name: 'Appearance', href: '/settings/appearance', icon: Palette },
        { name: 'Accessibility', href: '/settings/accessibility', icon: Settings },
        { name: 'Language', href: '/settings/language', icon: Globe },
        { name: 'Region', href: '/settings/region', icon: Globe },
        { name: 'Timezone', href: '/settings/timezone', icon: Clock },
      ],
    },
    {
      title: 'Organization',
      items: [
        { name: 'Organization', href: '/settings/organization', icon: Building },
        { name: 'Workspaces', href: '/settings/workspace', icon: Users },
        { name: 'Roles', href: '/settings/roles', icon: Shield },
        { name: 'Permissions', href: '/settings/permissions', icon: ShieldCheck },
        { name: 'Team', href: '/settings/team', icon: Users },
      ],
    },
    {
      title: 'Billing & Finance',
      items: [
        { name: 'Subscription', href: '/settings/subscription', icon: CreditCard },
        { name: 'Credits & Billing', href: '/settings/billing', icon: CreditCard },
        { name: 'Payments', href: '/settings/payments', icon: CreditCard },
        { name: 'Invoices', href: '/settings/invoices', icon: FileText },
        { name: 'Usage', href: '/settings/usage', icon: Activity },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        { name: 'Storage', href: '/settings/storage', icon: HardDrive },
        { name: 'Backups', href: '/settings/backups', icon: Database },
        { name: 'Import', href: '/settings/import', icon: Download },
        { name: 'Export', href: '/settings/export', icon: Upload },
      ],
    },
    {
      title: 'APIs & Integrations',
      items: [
        { name: 'Developer APIs', href: '/settings/developer', icon: Code },
        { name: 'API Keys', href: '/settings/api-keys', icon: Key },
        { name: 'Webhooks', href: '/settings/webhooks', icon: Webhook },
        { name: 'Automation', href: '/settings/automation', icon: Zap },
        { name: 'Integrations', href: '/settings/integrations', icon: Puzzle },
      ],
    },
    {
      title: 'AI Settings',
      items: [{ name: 'AI Preferences', href: '/settings/ai', icon: Bot }],
    },
    {
      title: 'Communications',
      items: [
        { name: 'Notifications', href: '/settings/notifications', icon: Bell },
        { name: 'Email', href: '/settings/email', icon: Mail },
        { name: 'SMS', href: '/settings/sms', icon: MessageSquare },
        { name: 'Push', href: '/settings/push', icon: Bell },
      ],
    },
    {
      title: 'System & Advanced',
      items: [
        { name: 'Audit Logs', href: '/settings/audit', icon: FileText },
        { name: 'System Logs', href: '/settings/logs', icon: FileText },
        { name: 'Advanced', href: '/settings/advanced', icon: Settings },
        { name: 'Experimental', href: '/settings/experimental', icon: FlaskConical },
        { name: 'Feature Flags', href: '/settings/feature-flags', icon: Settings },
        { name: 'Danger Zone', href: '/settings/danger-zone', icon: AlertTriangle },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-neutral-secondary mt-2">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-8">
              {settingsGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((tab) => {
                      const isActive = pathname === tab.href;
                      const Icon = tab.icon;
                      return (
                        <Link
                          key={tab.name}
                          href={tab.href}
                          className={clsx(
                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-neutral-secondary hover:bg-white/5 hover:text-white'
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {tab.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 pb-16">{children}</main>
        </div>
      </div>
    </DashboardLayout>
  );
}
