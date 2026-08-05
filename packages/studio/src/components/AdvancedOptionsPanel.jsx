import React from 'react';

const STYLE_PRESETS = ['None', 'Photorealistic', 'Anime', 'Cinematic', 'Oil Painting', 'Watercolor', 'Digital Art', 'Concept Art', 'Cyberpunk'];

export default function AdvancedOptionsPanel({
  onClose,
  
  selectedStyle,
  setSelectedStyle,
  
  negativePrompt,
  setNegativePrompt,
  
  guidanceScale,
  setGuidanceScale,
  
  steps,
  setSteps,
  
  seed,
  setSeed,
  
  batchCount,
  setBatchCount,
  
  customWidth,
  setCustomWidth,
  
  customHeight,
  setCustomHeight,
  
  referenceStrength,
  setReferenceStrength,
  
  selectedLora,
  setSelectedLora,
  
  loraWeight,
  setLoraWeight,

  isI2I = false
}) {
  return (
    <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <h3 className="text-sm font-bold text-white">Advanced Options</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Style Presets */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Style Preset</label>
        <div className="flex gap-2 flex-wrap">
          {STYLE_PRESETS.map(s => (
            <button 
              key={s}
              onClick={() => setSelectedStyle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStyle === s
                  ? 'bg-[#22d3ee] text-black'
                  : 'bg-white/5 text-[#888] hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      {/* Negative Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Negative Prompt</label>
        <input 
          type="text" 
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="What to exclude (e.g., blurry, low quality, distorted)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
        />
      </div>
      
      {/* Guidance Scale & Steps Row */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Guidance Scale (CFG)</label>
            <span className="text-xs font-bold text-[#22d3ee]">{guidanceScale}</span>
          </div>
          <input 
            type="range" 
            min="1" max="20" step="0.5" 
            value={guidanceScale}
            onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#22d3ee]"
          />
        </div>
        
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Steps</label>
            <span className="text-xs font-bold text-[#22d3ee]">{steps}</span>
          </div>
          <input 
            type="range" 
            min="1" max="50" step="1" 
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#22d3ee]"
          />
        </div>
      </div>
      
      {/* Seed */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Seed</label>
          <button 
            onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
            className="text-xs font-bold text-[#22d3ee] hover:text-[#22d3ee]/80 transition-colors"
          >
            Randomize
          </button>
        </div>
        <input 
          type="number" 
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10) || -1)}
          placeholder="-1 for random"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
        />
      </div>
      
      {/* Batch Count */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Batch Count</label>
          <span className="text-xs font-bold text-[#22d3ee]">{batchCount}</span>
        </div>
        <input 
          type="range" 
          min="1" max="4" step="1" 
          value={batchCount}
          onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#22d3ee]"
        />
      </div>
      
      {/* Width & Height */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[120px] flex flex-col gap-2">
          <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Custom Width</label>
          <input 
            type="number"
            value={customWidth || ''}
            onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 0)}
            placeholder="0 = Auto"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          />
        </div>
        <div className="flex-1 min-w-[120px] flex flex-col gap-2">
          <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Custom Height</label>
          <input 
            type="number" 
            value={customHeight || ''}
            onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 0)}
            placeholder="0 = Auto"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          />
        </div>
      </div>
      
      {/* Reference Strength (for I2I models) */}
      {isI2I && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Reference Strength</label>
            <span className="text-xs font-bold text-[#22d3ee]">{referenceStrength}%</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" step="5" 
            value={referenceStrength}
            onChange={(e) => setReferenceStrength(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#22d3ee]"
          />
          <p className="text-[10px] text-[#555]">Higher means more like the original image, lower means more like the prompt.</p>
        </div>
      )}
      
      {/* LoRA Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">LoRA Model (Civitai ID or URL)</label>
        <input 
          type="text" 
          value={selectedLora}
          onChange={(e) => setSelectedLora(e.target.value)}
          placeholder="e.g., 123456 or https://civitai.com/models/..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
        />
        <div className="flex items-center gap-2 mt-1">
          <label className="text-xs font-bold text-[#888]">LoRA Weight:</label>
          <input 
            type="number" 
            min="0" max="4" step="0.1"
            value={loraWeight}
            onChange={(e) => setLoraWeight(parseFloat(e.target.value) || 0)}
            className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
          />
        </div>
        <p className="text-[10px] text-[#555]">Optional. Only supported by models that allow dynamic LoRA loading.</p>
      </div>
    </div>
  );
}
