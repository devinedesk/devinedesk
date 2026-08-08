import React from 'react';
import Link from 'next/link';
import { FiLifeBuoy, FiBook, FiCode, FiArrowRight } from 'react-icons/fi';

export const metadata = {
  title: 'Help Center | DevineDesk',
  description: 'DevineDesk Public Help Center and FAQ',
};

export default function SupportCenter() {
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
            Go to Dashboard
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white tracking-tight mb-4">How can we help?</h1>
          <p className="text-lg text-zinc-500">
            Search our knowledge base or open a ticket for personalized support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link
            href="/docs"
            className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
          >
            <div className="h-10 w-10 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FiBook size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Documentation</h3>
            <p className="text-sm text-zinc-400">
              Read our comprehensive guides on building AI workflows.
            </p>
          </Link>

          <Link
            href="/docs/api"
            className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
          >
            <div className="h-10 w-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FiCode size={20} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">API Reference</h3>
            <p className="text-sm text-zinc-400">
              Integrate DevineDesk deeply into your own applications.
            </p>
          </Link>

          <Link
            href="/dashboard/support"
            className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FiLifeBuoy size={100} />
            </div>
            <div className="relative z-10">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FiLifeBuoy size={20} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Open a Ticket</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Contact our enterprise support team for direct assistance.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                Go to ticketing <FiArrowRight />
              </div>
            </div>
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'How do I trigger workflows externally?',
                a: 'You can trigger workflows securely using our Webhook endpoints. Navigate to your Workspace Settings to generate an API key, then send a POST request to /api/webhooks.',
              },
              {
                q: 'Can I use custom AI models?',
                a: "Yes. DevineDesk's abstraction layer allows you to plug in API keys for OpenAI, Anthropic, Gemini, or even custom hosted LLMs via the HTTP Request node.",
              },
              {
                q: 'How does billing work?',
                a: 'Billing is managed per workspace via Stripe. We offer a usage-based execution tier and an Enterprise unlimited tier. Visit /dashboard/billing to manage your subscription.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-zinc-800 rounded-xl p-5 bg-[#0a0a0a]">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
