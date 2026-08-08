import React, { useState, useEffect, useRef } from 'react';

export const PROVIDER_LOGOS = {
  openai: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  google: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  kling: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  alibaba: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  bytedance: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  blackforest: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  minimax: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  suno: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  anthropic: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  meshy: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  tripo3d: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  grok: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  platform: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  midjourney: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  vidu: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  runway: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  luma: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  ideogram: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  leonardoai: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  hunyuan: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  hidream: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  lightricks: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  pixverse: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  reve: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
  stability: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80',
};

export const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];

const CheckSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="text-primary"
    strokeWidth="4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function ModelDropdown({
  models,
  toolsModels = [],
  selectedModel,
  onSelect,
  onClose,
  useLocalModel = false,
  modelType = 'Models',
  toolsType = 'Tools',
}) {
  const [search, setSearch] = useState('');

  const allCurrentModels = [...models, ...toolsModels];
  const currentModelObj = allCurrentModels.find((m) => m.id === selectedModel);
  const initialProvider = currentModelObj?.provider || 'all';
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);

  const activeItemRef = useRef(null);

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  const getProviderStyle = (provider) => {
    switch (provider) {
      case 'local':
        return { text: 'L', bg: 'bg-green-500/10 text-green-400 border-green-500/25' };
      case 'grok':
        return { text: 'xI', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/25' };
      case 'openai':
        return { text: 'O', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' };
      case 'google':
        return { text: 'G', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/25' };
      case 'blackforest':
        return { text: 'BF', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25' };
      case 'bytedance':
        return { text: 'BD', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/25' };
      case 'midjourney':
        return { text: 'MJ', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' };
      case 'kling':
        return { text: 'KL', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25' };
      case 'vidu':
        return { text: 'VD', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' };
      case 'minimax':
        return { text: 'MX', bg: 'bg-pink-500/10 text-pink-400 border-pink-500/25' };
      case 'ideogram':
        return { text: 'ID', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' };
      case 'luma':
        return { text: 'LM', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/25' };
      case 'alibaba':
        return { text: 'AL', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/25' };
      case 'leonardoai':
        return { text: 'LE', bg: 'bg-violet-500/10 text-violet-400 border-violet-500/25' };
      case 'stability':
        return { text: 'SD', bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25' };
      default:
        const name = provider ? provider.toUpperCase() : 'AI';
        return { text: name.substring(0, 2), bg: 'bg-primary/10 text-primary border-primary/25' };
    }
  };

  const availableProviders = [];
  const seenProviders = new Set();

  allCurrentModels.forEach((m) => {
    const pId = m.provider || (useLocalModel ? 'local' : 'Local API');
    const pName = m.provider_name || (useLocalModel ? 'Local Inference' : 'Local API');
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({ id: pId, name: pName });
    }
  });

  const lf = search.toLowerCase();
  const filterFn = (m) => {
    if (selectedProvider !== 'all') {
      const pId = m.provider || (useLocalModel ? 'local' : 'Local API');
      if (pId !== selectedProvider) return false;
    }
    return m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf);
  };

  const filteredMain = models.filter(filterFn);
  const filteredTools = toolsModels.filter(filterFn);

  const getIconColor = (m, isTool) => {
    if (isTool) return 'bg-orange-500/10 text-orange-400 border-orange-500/10';
    if (m.id.includes('kling')) return 'bg-blue-500/10 text-blue-400 border-blue-500/10';
    if (m.id.includes('veo')) return 'bg-purple-500/10 text-purple-400 border-purple-500/10';
    if (m.id.includes('sora')) return 'bg-rose-500/10 text-rose-400 border-rose-500/10';
    return 'bg-primary/10 text-primary border-primary/10';
  };

  const renderItem = (m, isTool = false) => (
    <div
      key={m.id}
      ref={selectedModel === m.id ? activeItemRef : null}
      className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? 'bg-white/5 border-white/5' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(m, isTool);
        onClose?.();
      }}
    >
      <div className="flex items-center gap-3.5">
        {PROVIDER_LOGOS[m.provider] ? (
          <div className="w-8 h-8 rounded-xl border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]">
            <img
              src={PROVIDER_LOGOS[m.provider]}
              alt={m.provider_name}
              className={`w-full h-full object-contain p-1 ${invertLogos.includes(m.provider) ? 'invert' : ''}`}
            />
          </div>
        ) : (
          <div
            className={`w-9 h-9 ${getIconColor(m, isTool)} border rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase`}
          >
            {m.name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-bold text-white tracking-tight truncate">{m.name}</span>
          {isTool && m.imageField ? (
            <span className="text-[9px] text-orange-400/70">Upload a video and image</span>
          ) : isTool ? (
            <span className="text-[9px] text-orange-400/70">Upload a video to use</span>
          ) : (
            selectedProvider === 'all' &&
            m.provider_name && <span className="text-[9px] text-white/60">{m.provider_name}</span>
          )}
        </div>
      </div>
      {selectedModel === m.id && <CheckSvg />}
    </div>
  );

  return (
    <div className="flex gap-4 h-full max-h-[70vh] min-h-[350px]">
      <div className="flex flex-col gap-2.5 items-center pr-2 border-r border-white/5 shrink-0 select-none overflow-y-auto custom-scrollbar w-14 pt-0.5">
        <button
          type="button"
          onClick={() => setSelectedProvider('all')}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ${
            selectedProvider === 'all'
              ? 'bg-white/10 text-yellow-400 border-yellow-500/30 shadow-md scale-105'
              : 'bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white'
          }`}
          title="All Providers"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={selectedProvider === 'all' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        {availableProviders.map((p) => {
          const style = getProviderStyle(p.id);
          const isSelected = selectedProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProvider(p.id)}
              className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-black text-[10px] border transition-all flex-shrink-0 cursor-pointer overflow-hidden ${
                isSelected
                  ? `${style.bg} border-white/25 scale-105 shadow-md`
                  : 'bg-white/[0.02] text-white/60 border-white/[0.02] hover:bg-white/5 hover:text-white/80'
              }`}
              title={p.name}
            >
              {PROVIDER_LOGOS[p.id] ? (
                <img
                  src={PROVIDER_LOGOS[p.id]}
                  alt={p.name}
                  className={`w-full h-full rounded-full object-contain ${invertLogos.includes(p.id) ? 'invert' : ''}`}
                />
              ) : (
                style.text
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="px-1 pb-2 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5 focus-within:border-primary/50 transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
            />
          </div>
        </div>

        <div className="text-xs font-bold text-secondary px-2 py-1 shrink-0 flex items-center justify-between">
          <span>{modelType}</span>
          {selectedProvider !== 'all' && (
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60">
              {availableProviders.find((p) => p.id === selectedProvider)?.name || selectedProvider}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1">
          {filteredMain.length === 0 && filteredTools.length === 0 ? (
            <div className="text-xs text-white/60 text-center py-6">No models found</div>
          ) : (
            <>
              {filteredMain.map((m) => renderItem(m, false))}
              {filteredTools.length > 0 && (
                <>
                  <div className="text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5">
                    {toolsType}
                  </div>
                  {filteredTools.map((m) => renderItem(m, true))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
