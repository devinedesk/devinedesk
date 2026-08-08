import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | DevineDesk',
  description: 'DevineDesk Privacy Policy and Data Collection Practices',
};

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-zinc-500 mb-12">Last updated: August 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including when you create an
              account, build workflows, use our AI generation tools, or communicate with us. This
              includes your name, email address, payment information, and any data you transmit
              through our workflow engine nodes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to operate, maintain, and improve our services. This
              includes powering our AI nodes, managing your workspace subscriptions, processing your
              webhook payloads, and ensuring the security of the DevineDesk platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
            <p>
              Security is foundational to DevineDesk. We utilize enterprise-grade encryption and
              secure infrastructure via AWS and Vercel to protect your API keys, workflow
              configurations, and generated content from unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at
              privacy@devinedesk.com or via our Support Center.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
