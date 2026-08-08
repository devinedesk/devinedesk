'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Bot, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/src/store/useAppStore';

export default function AgentCreateClient({ userData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
  });

  const setActiveAgentId = useAppStore((state) => state.setActiveAgentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');

    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/agents/create', formData);
      toast.success('Agent created successfully!');
      const newAgentId = res.data?.id || res.data?.slug || '';
      if (newAgentId) setActiveAgentId(newAgentId);
      router.push(`/agents/${newAgentId}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-white/80 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/agents"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-3">
              <Bot className="w-6 h-6 text-primary" />
              Create New Agent
            </h1>
            <p className="text-secondary">Configure a new AI persona for your studio.</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-panel-bg p-8 rounded-2xl border border-white/5"
        >
          <Input
            label="Agent Name"
            value={formData.name}
            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Design Assistant"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief summary of capabilities"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">System Prompt</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData((f) => ({ ...f, systemPrompt: e.target.value }))}
              className="w-full h-32 bg-card-bg border border-muted hover:border-secondary rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app-bg transition-colors resize-none"
              placeholder="You are a helpful assistant..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
