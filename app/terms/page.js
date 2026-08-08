import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | DevineDesk',
  description: 'DevineDesk Terms of Service and User Agreement',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030303]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 bg-cyan-500 rounded flex items-center justify-center">
              <span className="text-black font-black text-xs">D</span>
            </div>
            <span className="font-bold text-white tracking-tight">DevineDesk</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-all"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Terms of Service</h1>
        <p className="text-zinc-500 mb-12">Last updated: August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the DevineDesk platform, you agree to be bound by these Terms.
              If you disagree with any part of the terms, you may not access our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Provision</h2>
            <p>
              DevineDesk provides an advanced AI workflow automation platform. We reserve the right
              to modify, suspend, or discontinue the service with or without notice at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. API & Usage Limits</h2>
            <p>
              Your use of the DevineDesk API, webhook infrastructure, and AI execution engine is
              subject to rate limiting and fair use policies. Excessive usage that degrades platform
              performance may result in temporary throttling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Limitation of Liability</h2>
            <p>
              In no event shall DevineDesk, nor its directors, employees, partners, agents,
              suppliers, or affiliates, be liable for any indirect, incidental, special,
              consequential or punitive damages resulting from your use of the platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
