'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Terminal,
  Key,
  Webhook,
  BookOpen,
  ExternalLink,
  Code2,
  Copy,
  AlertCircle,
} from 'lucide-react';

export default function DeveloperDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Developer Center</h2>
        <p className="text-neutral-secondary mt-1">
          Manage API keys, webhooks, and access platform documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Links */}
        <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 md:col-span-2">
          <h3 className="text-lg font-medium text-white mb-4">Quick Start Guide</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg h-fit">
                    <Terminal className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">1. Get your API Key</h4>
                    <p className="text-sm text-neutral-400 mt-1">
                      Generate a secret key to authenticate your API requests.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/settings/api-keys">Manage Keys</a>
                </Button>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded-lg h-fit">
                    <Code2 className="text-cyan-500 h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">2. Make your first request</h4>
                    <p className="text-sm text-neutral-400 mt-1">
                      Use our REST API to generate an image programmatically.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/docs/api" target="_blank">
                    View Docs <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
              <div className="mt-4 p-3 bg-black/50 border border-white/10 rounded-lg relative group">
                <pre className="text-xs text-neutral-300 overflow-x-auto">
                  {`curl -X POST https://api.devinedesk.com/v1/generate \\
  -H "Authorization: Bearer sk_prod_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic cyberpunk city, neon lights, 4k",
    "model": "flux-schnell"
  }'`}
                </pre>
                <button className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Status & Limits */}
        <div className="space-y-6">
          <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
            <h3 className="text-lg font-medium text-white mb-4">API Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-400">Requests (Last 24h)</span>
                  <span className="text-white font-medium">1,240 / 10,000</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '12.4%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-400">Rate Limit</span>
                  <span className="text-green-400 font-medium text-xs flex items-center">
                    <AlertCircle size={12} className="mr-1" /> Healthy
                  </span>
                </div>
                <p className="text-xs text-neutral-500">100 requests / minute</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-neutral-border-glass bg-neutral-card-bg/50">
            <h3 className="text-lg font-medium text-white mb-4">Resources</h3>
            <div className="space-y-3">
              <a
                href="/settings/webhooks"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Webhook className="text-purple-400 h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                      Webhooks
                    </div>
                    <div className="text-xs text-neutral-500">Configure event callbacks</div>
                  </div>
                </div>
              </a>

              <a
                href="/docs"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="text-blue-400 h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                      Documentation
                    </div>
                    <div className="text-xs text-neutral-500">Read the platform guides</div>
                  </div>
                </div>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
