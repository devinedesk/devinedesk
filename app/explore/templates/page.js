'use client';

import { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { Search, Plus, FileText, Globe, Lock, Code, Loader2 } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function PromptTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/prompt-templates?public=true');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Basic extraction of variables from content (e.g. {{variable}})
      const variableRegex = /{{([^}]+)}}/g;
      const matches = [...content.matchAll(variableRegex)];
      const variables = [...new Set(matches.map((m) => m[1].trim()))];

      const res = await fetch('/api/prompt-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, content, variables, isPublic }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setContent('');
        setIsPublic(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen bg-app-bg text-white p-8 ${inter.className}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="text-[#22d3ee]" size={32} />
              Prompt Templates
            </h1>
            <p className="text-gray-400 mt-2">
              Discover, manage, and share reusable AI prompt templates.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#22d3ee] text-black px-6 py-2.5 rounded-lg font-medium hover:bg-[#1ab8d1] transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Template
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#22d3ee] transition-colors backdrop-blur-md"
            />
          </div>
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <button className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium">All</button>
            <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
              My Templates
            </button>
            <button className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Public
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#22d3ee]" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
            <FileText size={48} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-gray-400">Try adjusting your search or create a new template.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-black/40 border border-white/10 p-6 rounded-xl backdrop-blur-md hover:border-white/20 transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-white group-hover:text-[#22d3ee] transition-colors truncate pr-4">
                    {template.name}
                  </h3>
                  {template.isPublic ? (
                    <Globe size={16} className="text-blue-400 shrink-0" title="Public" />
                  ) : (
                    <Lock size={16} className="text-gray-500 shrink-0" title="Private" />
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                  {template.description || 'No description provided.'}
                </p>
                <div className="bg-black/60 rounded-lg p-3 mb-4 font-mono text-xs text-gray-300 line-clamp-3 relative">
                  <div className="absolute top-2 right-2 text-gray-600">
                    <Code size={14} />
                  </div>
                  {template.content}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                  <span>Version {template.version}</span>
                  <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Create Prompt Template</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#22d3ee]"
                    placeholder="e.g. SEO Blog Post Generator"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#22d3ee]"
                    placeholder="Brief description of what this prompt does"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Prompt Content{' '}
                    <span className="text-gray-500 font-normal">
                      (Use {'{{variable}}'} for dynamic inputs)
                    </span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#22d3ee]"
                    placeholder="Write a blog post about {{topic}} for {{audience}}..."
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 bg-black border-white/20 rounded accent-[#22d3ee]"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-300 cursor-pointer">
                    Make this template public (visible to everyone)
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#22d3ee] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#1ab8d1] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Save Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
