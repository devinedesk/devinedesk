import React, { useState, useEffect } from 'react';
import { LocalModelManager } from './LocalModelManager.jsx';
import { isLocalAIAvailable } from '../../../../src/lib/localInferenceClient.js';
import { t } from '../../../../src/lib/i18n.js';
import { useSettings } from '../contexts/SettingsContext.jsx';

export function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('api');
  const { keys: contextKeys, updateMultipleKeys } = useSettings();

  // Form State
  const [keys, setKeys] = useState(contextKeys);

  useEffect(() => {
    setKeys(contextKeys);
  }, [contextKeys]);

  const handleChange = (key) => (e) => {
    setKeys(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = () => {
    updateMultipleKeys(keys);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4 font-inter">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-lg font-bold text-white m-0 tracking-tight">{t('settings.title') || 'Settings'}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white hover:bg-white/5 rounded-md p-1.5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 border-b border-white/5 shrink-0 bg-[#0a0a0a]">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all ${
              activeTab === 'api' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t('settings.apiKey') || 'API Keys'}
          </button>
          {isLocalAIAvailable() && (
            <button
              onClick={() => setActiveTab('local')}
              className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-all ${
                activeTab === 'local' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t('settings.localModels') || 'Local Models'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          {activeTab === 'api' ? (
            <div className="flex flex-col gap-4 pb-16">
              {[
                { id: 'openrouter_key', label: 'OpenRouter API Key (Text & Image)', placeholder: 'sk-or-v1-...' },
                { id: 'aimlapi_key', label: 'AI/ML API Key (Video & Audio)', placeholder: 'Enter AIMLAPI Key' },
                { id: 'goapi_key', label: 'GoAPI Key (Midjourney)', placeholder: 'Enter GoAPI Key' },
                { id: 'hf_token', label: 'Hugging Face Token (3D & Niche)', placeholder: 'hf_...' },
                { id: 'fal_key', label: 'Fal.ai Key (Lip-sync)', placeholder: 'Enter Fal.ai Key' },
                { id: 'cloudinary_cloud_name', label: 'Cloudinary Cloud Name (File Uploads)', placeholder: 'Enter Cloud Name', type: 'text' },
                { id: 'cloudinary_upload_preset', label: 'Cloudinary Upload Preset', placeholder: 'Enter Upload Preset', type: 'text' },
                { id: 'platform_api_key', label: 'Platform API Key (Legacy)', placeholder: 'Enter Platform API Key' },
              ].map(field => (
                <div key={field.id} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/50">{field.label}</label>
                  <input
                    type={field.type || 'password'}
                    value={keys[field.id]}
                    onChange={handleChange(field.id)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#22d3ee]/50 focus:ring-1 focus:ring-[#22d3ee]/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all"
                  />
                </div>
              ))}
              <p className="text-xs text-white/30 mt-2">
                Configure multiple API keys for the Multi-Provider routing model.
              </p>
            </div>
          ) : (
            <div className="pb-16">
              <LocalModelManager />
            </div>
          )}
        </div>

        {/* Footer (Absolute position to always be at bottom or fixed in the flex) */}
        {activeTab === 'api' && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#111] via-[#111] to-transparent pointer-events-none">
            <div className="flex justify-end gap-3 pointer-events-auto mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 transition-all"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-[#22d3ee] text-black text-sm font-bold hover:scale-105 transition-all"
              >
                {t('common.save') || 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
