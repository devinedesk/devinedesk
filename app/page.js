import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { ArrowRight, Layers, Zap, Shield, Code, Cpu, Workflow } from 'lucide-react';

export default async function LandingPage() {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <span className="text-black font-black text-lg tracking-tighter">D</span>
            </div>
            <span className="font-bold text-xl tracking-tight">DevineDesk</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
            <Link href="#features" className="hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-primary transition-colors">
              Developers
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}

            <Link
              href={session ? '/studio' : '/auth/login'}
              className="bg-primary hover:bg-primary-hover text-black font-bold text-sm px-5 py-2 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
            >
              {session ? 'Go to Studio' : 'Get Started'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto mt-12 md:mt-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-primary/30 text-primary text-xs font-medium tracking-wide uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            DevineDesk 2.0 is Live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            Automate the Impossible with <br />
            <span className="text-primary bg-none filter drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
              AI Workflows.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl leading-relaxed">
            The ultimate visual infrastructure for enterprise automation. Connect language models,
            APIs, and data sources through a seamless drag-and-drop DAG engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link
              href={session ? '/studio' : '/auth/signin'}
              className="bg-primary hover:bg-primary-hover text-black font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.5)] flex items-center gap-2"
            >
              Start Building Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-lg px-8 py-4 rounded-2xl transition-all flex items-center gap-2"
            >
              Explore Platform
            </Link>
          </div>
        </div>

        {/* Product Preview Image / Mockup */}
        <div className="mt-24 relative w-full max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-2xl shadow-primary/10">
          <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-black/40">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
          </div>
          <div className="aspect-video relative bg-[#0a0a0a] flex items-center justify-center p-8">
            {/* Mock Nodes Graphic */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            ></div>
            <div className="relative z-10 flex gap-8 items-center">
              <div className="w-48 h-24 bg-white/5 border border-primary/40 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="flex flex-col items-center">
                  <Cpu className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-mono text-neutral-300">LLM Node</span>
                </div>
              </div>
              <div className="h-0.5 w-16 bg-gradient-to-r from-primary to-purple-500 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              </div>
              <div className="w-48 h-24 bg-white/5 border border-purple-500/40 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                <div className="flex flex-col items-center">
                  <Code className="h-6 w-6 text-purple-400 mb-2" />
                  <span className="text-xs font-mono text-neutral-300">HTTP Request</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Enterprise Grade Infrastructure
            </h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Everything you need to build, scale, and secure your automated business logic in one
              unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Workflow className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Visual DAG Engine</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Design complex workflows visually. Pass variables natively between AI nodes, HTTP
                requests, and logical branches.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-400/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Multi-Tenancy</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Isolate environments with dedicated Workspaces. Invite team members with granular
                Role-Based Access Control (RBAC).
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-purple-400/30 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-purple-400/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Webhooks & APIs</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Dispatch real-time HTTP payloads on workflow completion. Integrate DevineDesk
                flawlessly into your existing stack.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-green-400/30 transition-all group lg:col-span-3 lg:flex gap-8 items-center">
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-green-400/10 flex items-center justify-center mb-6 lg:mb-0 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Bank-Grade Security & Auditing
                </h3>
                <p className="text-neutral-400 text-base leading-relaxed max-w-3xl">
                  Secure your operations with cryptographic password hashing (bcrypt), robust
                  session management via NextAuth, and immutable Enterprise Audit Logs that track
                  every single action taken across your organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#030303] pt-16 pb-8 relative z-10 mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
                <span className="text-black font-black text-xs">D</span>
              </div>
              <span className="font-bold text-lg">DevineDesk</span>
            </div>
            <p className="text-sm text-neutral-500">
              The world&apos;s most advanced platform for AI automation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/studio" className="hover:text-primary transition-colors">
                  Studio
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Enterprise
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/docs" className="hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-primary transition-colors">
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} DevineDesk Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Built with Next.js & Prisma</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
