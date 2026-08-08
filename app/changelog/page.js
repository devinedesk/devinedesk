import { Rocket, Zap, Bug, Shield } from 'lucide-react';

export const metadata = {
  title: 'Changelog | DevineDesk',
  description: 'New updates and improvements to DevineDesk.',
};

const releases = [
  {
    version: 'v2.4.0',
    date: 'August 5, 2026',
    title: 'Advanced RBAC & 2FA Rollout',
    changes: [
      {
        type: 'feature',
        icon: Shield,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        text: 'Added strict Two-Factor Authentication via TOTP.',
      },
      {
        type: 'feature',
        icon: Shield,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        text: 'Expanded organization roles to include Manager, Viewer, and Guest.',
      },
      {
        type: 'improvement',
        icon: Zap,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        text: 'Optimized Prisma queries for dashboard metric loading.',
      },
    ],
  },
  {
    version: 'v2.3.1',
    date: 'July 22, 2026',
    title: 'Workflow Engine Upgrades',
    changes: [
      {
        type: 'feature',
        icon: Rocket,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        text: 'New node types available in the Studio canvas.',
      },
      {
        type: 'bugfix',
        icon: Bug,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        text: 'Resolved an issue where Webhooks would timeout after 10s.',
      },
      {
        type: 'bugfix',
        icon: Bug,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        text: 'Fixed infinite redirect loop for unauthenticated users.',
      },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#050505]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Changelog
          </h1>
          <p className="text-xl text-neutral-400">
            See what's new, what's fixed, and what we're working on.
          </p>
        </div>

        <div className="space-y-16 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {releases.map((release, index) => (
            <div
              key={release.version}
              className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-in fade-in slide-in-from-bottom-4 delay-\${index * 100}`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-neutral-900 text-neutral-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] border border-white/5 p-6 rounded-3xl shadow-xl hover:bg-white/[0.04] transition-colors">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <h3 className="text-xl font-bold text-white">{release.title}</h3>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      {release.version}
                    </span>
                    <time className="text-xs text-neutral-500 mt-1">{release.date}</time>
                  </div>
                </div>

                <ul className="space-y-4">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start text-neutral-300">
                      <div
                        className={`shrink-0 mt-0.5 mr-3 p-1.5 rounded-lg \${change.bg} \${change.color}`}
                      >
                        <change.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm leading-relaxed">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
