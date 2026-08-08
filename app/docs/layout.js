"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Code, Zap, Book, Key } from "lucide-react";

export default function DocsLayout({ children }) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Introduction', href: '/docs', icon: Book },
    { name: 'Authentication', href: '/docs/api#auth', icon: Key },
    { name: 'Workflows API', href: '/docs/api#workflows', icon: Zap },
    { name: 'Webhooks', href: '/docs/api#webhooks', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-black/50 backdrop-blur-xl md:sticky md:top-0 md:h-screen flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">devinedesk</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">API Reference</h4>
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname === '/docs/api' && item.href.startsWith('/docs/api'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-neutral-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/developer" className="block text-center text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto p-6 md:p-12 lg:p-16">
        {children}
      </main>
    </div>
  );
}
