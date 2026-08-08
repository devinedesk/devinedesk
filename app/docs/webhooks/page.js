import React from "react";
import Link from "next/link";
import { FiArrowLeft, FiGlobe, FiKey, FiTerminal } from "react-icons/fi";

export const metadata = {
  title: "Webhooks | DevineDesk Docs",
  description: "Learn how to configure and secure DevineDesk webhooks.",
};

export default function WebhooksDocs() {
  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <main className="pt-24 pb-24 max-w-4xl mx-auto px-6">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
          <FiArrowLeft /> Back to Documentation
        </Link>
        
        <div className="mb-12">
          <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
            <FiGlobe size={24} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Webhooks Integration</h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Configure inbound payloads to receive real-time notifications when your AI workflows complete, fail, or require human intervention.
          </p>
        </div>

        <div className="space-y-12">
          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiTerminal className="text-emerald-400" /> 1. Subscribing to Events
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                You can create a webhook endpoint in the Developer Settings of your dashboard. DevineDesk supports the following event types:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><code className="text-white">workflow.completed</code>: Triggered when a workflow successfully finishes execution.</li>
                <li><code className="text-white">workflow.failed</code>: Triggered when any node within the workflow encounters a fatal error.</li>
                <li><code className="text-white">asset.generated</code>: Triggered immediately when a sub-asset (e.g., an image) is generated within a broader pipeline.</li>
              </ul>
            </div>
          </section>

          <section className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <FiKey className="text-emerald-400" /> 2. Security & Signatures
            </h2>
            <div className="space-y-4 text-zinc-400 leading-relaxed">
              <p>
                To verify that a webhook was actually sent by DevineDesk, all payloads include a cryptographic signature in the <code>x-devinedesk-signature</code> header.
              </p>
              <p>
                The signature is computed using an HMAC with the SHA-256 hash function, using your webhook secret as the key and the raw request body as the message.
              </p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm border border-zinc-800/50 mt-4">
{`const crypto = require('crypto');

const expectedSignature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(rawRequestBody)
  .digest('hex');

if (req.headers['x-devinedesk-signature'] !== expectedSignature) {
  return res.status(401).send('Invalid signature');
}`}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
