import React from 'react';

export const metadata = {
  title: 'API Reference | DevineDesk',
  description: 'Integrate with the DevineDesk platform.',
};

export default function ApiDocsPage() {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">API Reference</h1>
        <p className="text-lg text-neutral-400 max-w-2xl">
          The DevineDesk API is organized around REST. Our API has predictable resource-oriented URLs, accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.
        </p>
      </div>

      {/* Authentication */}
      <section id="auth" className="space-y-6 pt-10 border-t border-white/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Authentication</h2>
          <p className="text-neutral-400">
            Authenticate your API requests by including your secret API key in the `Authorization` header. You can manage your API keys in the <a href="/developer" className="text-primary hover:underline">Developer Dashboard</a>.
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
          <div className="bg-black/50 px-4 py-2 border-b border-white/10 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            <span className="ml-4 text-xs font-mono text-neutral-500">cURL</span>
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono text-neutral-300">
            <code className="text-pink-400">curl</code> https://api.devinedesk.com/v1/workflows \{"\n"}
            {"  "}-H <span className="text-green-400">&quot;Authorization: Bearer dev_live_xxxxxxxxxxxxx&quot;</span>
          </pre>
        </div>

        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-sm">
          <strong>Security Notice:</strong> Your API keys carry many privileges. Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, and so forth.
        </div>
      </section>

      {/* Workflows */}
      <section id="workflows" className="space-y-8 pt-10 border-t border-white/5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Workflows API</h2>
          <p className="text-neutral-400">
            Trigger complex AI architectures asynchronously. The workflow engine uses a Submit-Poll pattern due to the long-running nature of AI generation.
          </p>
        </div>

        {/* Execute Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-bold font-mono">POST</span>
              <code className="text-sm font-mono text-white">/api/v1/workflows/:id/execute</code>
            </div>
            <h3 className="text-xl font-semibold">Execute a Workflow</h3>
            <p className="text-sm text-neutral-400">
              Triggers a new execution run of the specified workflow. This endpoint returns a `runId` immediately, which you must use to poll for the final result.
            </p>
            
            <h4 className="text-sm font-semibold text-white mt-6 mb-2">Request Body</h4>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div>
                  <code className="text-sm text-primary">inputs</code>
                  <span className="text-xs text-neutral-500 ml-2">object</span>
                </div>
                <span className="text-xs text-neutral-400">Required</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A key-value map corresponding to the Input Nodes in your workflow graph.
              </p>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden sticky top-24">
            <div className="bg-black/50 px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-500">Request</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-neutral-300">
              <code className="text-pink-400">curl</code> -X POST https://api.devinedesk.com/v1/workflows/wf_123/execute \{"\n"}
              {"  "}-H <span className="text-green-400">&quot;Authorization: Bearer $API_KEY&quot;</span> {"\n"}
              {"  "}-H <span className="text-green-400">&quot;Content-Type: application/json&quot;</span> {"\n"}
              {"  "}-d <span className="text-yellow-300">&apos;{JSON.stringify({ inputs: { prompt: "A futuristic city" } }, null, 2)}&apos;</span>
            </pre>
            <div className="bg-black/50 px-4 py-3 border-y border-white/10 flex items-center justify-between mt-4">
              <span className="text-xs font-mono text-neutral-500">Response <span className="text-green-400 ml-2">200 OK</span></span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-neutral-300">
              {JSON.stringify({ success: true, runId: "run_abc123" }, null, 2)}
            </pre>
          </div>
        </div>

      </section>
      
      {/* Webhooks */}
      <section id="webhooks" className="space-y-8 pt-10 border-t border-white/5 pb-20">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-neutral-400">
            Instead of polling `/status`, you can register HTTP endpoints to receive POST requests when events occur.
          </p>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Verifying Signatures</h3>
          <p className="text-sm text-neutral-300 mb-4">
            DevineDesk signs the webhook events it sends to your endpoints by including a signature in each event&apos;s `X-DevineDesk-Signature` header.
          </p>
          <pre className="bg-black/50 p-4 rounded-lg text-xs font-mono text-neutral-400 overflow-x-auto border border-white/5">
            {`const crypto = require('crypto');\n\nconst signature = req.headers['x-devinedesk-signature'];\nconst expectedSignature = 'sha256=' + crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(req.body).digest('hex');\n\nif (signature !== expectedSignature) {\n  return res.status(401).send('Invalid signature');\n}`}
          </pre>
        </div>
      </section>

    </div>
  );
}
