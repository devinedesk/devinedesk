import React from "react";
import Link from "next/link";
import { FiCode, FiCpu, FiGlobe, FiDatabase, FiLock, FiTerminal } from "react-icons/fi";

export const metadata = {
  title: "Documentation | DevineDesk",
  description: "Learn how to build, deploy, and scale with DevineDesk.",
};

export default function DocsPortal() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="pt-24 pb-24 max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Documentation Hub</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Everything you need to build world-class AI automation pipelines. Master the visual engine, or integrate deeply via our APIs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/docs/api" className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 border border-zinc-800 p-8 rounded-3xl hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <FiCode size={120} />
            </div>
            <div className="relative z-10">
              <div className="h-12 w-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FiTerminal size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">API Reference</h3>
              <p className="text-zinc-400 mb-6 max-w-md leading-relaxed">
                Explore our comprehensive REST endpoints. Learn how to trigger workflows programmatically, fetch run histories, and manage workspace secrets securely.
              </p>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                Read the API Docs <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/docs/studio" className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all group">
            <div className="h-12 w-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FiCpu size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Studio Guides</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Master the visual DAG builder. Learn how to chain AI models, handle data routing, and parse outputs.
            </p>
            <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Read Guide →</div>
          </Link>

          <Link href="/docs/webhooks" className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all group">
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FiGlobe size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Webhooks</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Configure inbound payloads and secure your endpoints using DevineDesk signature verification.
            </p>
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors">Read Guide →</div>
          </Link>

          <Link href="/docs/security" className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] transition-all group">
            <div className="h-12 w-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FiLock size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Security & RBAC</h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Understand our Role-Based Access Control and how to secure API keys within your team.
            </p>
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest group-hover:text-amber-400 transition-colors">Read Guide →</div>
          </Link>
        </div>
      </main>
    </div>
  );
}
