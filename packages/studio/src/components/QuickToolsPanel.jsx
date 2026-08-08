import React, { useState } from 'react';
import { ENHANCE_TAGS, QUICK_PROMPTS } from '../../../../src/lib/promptUtils.js';

export default function QuickToolsPanel({ onClose, onSelectStarter, onUseEnhancedPrompt }) {
  const [basePrompt, setBasePrompt] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [copied, setCopied] = useState(false);

  const toggleTag = (tag) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setSelectedTags(next);
  };

  const getEnhancedPrompt = () => {
    const base = basePrompt.trim();
    const tags = Array.from(selectedTags).join(', ');
    return [base, tags].filter(Boolean).join(', ');
  };

  const handleCopy = () => {
    const text = getEnhancedPrompt();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleUse = () => {
    const text = getEnhancedPrompt();
    if (text) {
      onUseEnhancedPrompt(text);
      onClose();
    }
  };

  const enhancedText = getEnhancedPrompt();

  return (
    <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Quick Tools</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Quick Starters Section */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">
            Quick Starters
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  onSelectStarter(q.prompt);
                  onClose();
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-[#888] hover:bg-white/10 hover:text-primary transition-all text-left border border-white/5 hover:border-primary/30"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Enhancer Section */}
        <div className="flex-1">
          <h4 className="text-xs font-bold text-[#888] uppercase tracking-wider mb-3">
            Prompt Enhancer
          </h4>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="Start with a basic idea (e.g., 'a cat in space')"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-primary/50 transition-colors"
            />

            <div>
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-2 block">
                Enhancement Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ENHANCE_TAGS).map(([category, tags]) =>
                  tags.map((tag) => {
                    const isActive = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                          isActive
                            ? 'bg-primary text-black'
                            : 'bg-white/5 text-[#888] hover:bg-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">
                Enhanced Prompt
              </label>
              <div
                className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs min-h-[40px] ${enhancedText ? 'text-white' : 'text-[#555]'}`}
              >
                {enhancedText || 'Select tags to enhance your prompt...'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-[#888] hover:bg-white/10 transition-all"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleUse}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
                >
                  Use in Generator
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
