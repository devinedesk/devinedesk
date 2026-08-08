import React from "react";
import Link from "next/link";
import { FiArrowLeft, FiLock, FiShield, FiUsers } from "react-icons/fi";

export const metadata = {
  title: "Security & RBAC | DevineDesk Docs",
  description: "Learn how DevineDesk handles security, authentication, and Role-Based Access Control.",
};

export default function SecurityDocs() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="pt-24 pb-24 max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
          <FiArrowLeft /> Back to Documentation
        </Link>
        
        <div className="mb-12">
          <div className="h-12 w-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6">
            <FiLock size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Security & RBAC</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Understand how DevineDesk secures your data, enforces multi-tenant boundaries, and manages Role-Based Access Control (RBAC) across your organization.
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiUsers className="text-amber-400" /> 1. Role-Based Access Control (RBAC)
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                Organizations in DevineDesk support granular permissions based on three primary roles:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong className="text-white">Owner:</strong> Full control over the Organization. Can manage billing, delete workspaces, and provision API keys with cross-workspace scope.</li>
                <li><strong className="text-white">Admin:</strong> Can invite users, manage workspace settings, and view all audit logs.</li>
                <li><strong className="text-white">Member:</strong> Can access workspaces they are invited to, view and execute workflows, but cannot modify critical infrastructure settings.</li>
              </ul>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiShield className="text-amber-400" /> 2. API Key Security
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                API Keys are the primary method for authenticating automated programmatic access to DevineDesk. We implement the following security measures for keys:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong className="text-white">One-time Display:</strong> Keys are only shown once upon creation. We store a cryptographic hash (using bcrypt) in our database.</li>
                <li><strong className="text-white">Workspace Scoping:</strong> Keys can be scoped to specific Workspaces to prevent lateral movement in the event of a compromise.</li>
                <li><strong className="text-white">Rate Limiting:</strong> All API keys are subject to strict sliding-window rate limits enforced at our edge Gateway to prevent abuse.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
