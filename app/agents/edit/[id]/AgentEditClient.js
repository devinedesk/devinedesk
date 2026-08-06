"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Bot, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AgentEditClient({ userData, agentId }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: ""
  });

  useEffect(() => {
    // Fetch existing agent data (simplified for this rewrite)
    // Normally you'd pass it as a prop from the server component
    setIsLoading(false);
  }, [agentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    
    setIsSubmitting(true);
    try {
      // Typically posts to /api/agents/edit/[id] or similar
      await axios.put(`/api/agents/edit/${agentId}`, formData);
      toast.success("Agent updated successfully!");
      router.push(`/agents/${agentId}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#030303] text-white/60 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white/80 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/agents/${agentId || ""}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </Link>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-3">
              <Bot className="w-6 h-6 text-cyan-400" />
              Edit Agent
            </h1>
            <p className="text-white/40">Modify your AI persona configuration.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#0a0a0a] p-8 rounded-2xl border border-white/5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Agent Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
              placeholder="e.g. Design Assistant"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Description</label>
            <input 
              type="text" 
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors"
              placeholder="Brief summary of capabilities"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">System Prompt</label>
            <textarea 
              value={formData.systemPrompt}
              onChange={e => setFormData(f => ({ ...f, systemPrompt: e.target.value }))}
              className="w-full h-32 bg-[#030303] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
              placeholder="You are a helpful assistant..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400/10 text-cyan-400 font-medium hover:bg-cyan-400/20 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
