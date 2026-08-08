'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        if (res.ok) {
          const data = await res.json();
          setAgents(data.agents || []);
        }
      } catch (err) {
        toast.error('Failed to load agents');
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Bot className="h-8 w-8 text-cyan-500" /> AI Agents
          </h1>
          <p className="text-neutral-secondary mt-2">
            Manage and deploy autonomous AI agents for your organization.
          </p>
        </div>
        <Link href="/agents/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create Agent
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="h-48 animate-pulse bg-white/5 border-neutral-border-glass"
            ></Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-neutral-border-glass bg-neutral-card-bg/50">
          <Bot className="h-16 w-16 text-neutral-600 mb-4" />
          <h3 className="text-xl font-medium text-white">No Agents Yet</h3>
          <p className="text-neutral-400 mt-2 mb-6 max-w-md">
            Create your first AI agent to automate workflows, support, or data entry.
          </p>
          <Link href="/agents/create">
            <Button>Create Your First Agent</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="p-6 border-neutral-border-glass bg-neutral-card-bg/50 hover:border-cyan-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                  <Bot className="h-6 w-6 text-cyan-500" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{agent.name}</h3>
              <p className="text-sm text-neutral-400 mb-6 line-clamp-2">{agent.description}</p>
              <div className="pt-4 border-t border-neutral-border-glass flex items-center justify-between">
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  Active
                </span>
                <Link href={`/agents/${agent.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 group-hover:text-cyan-500">
                    Manage <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
