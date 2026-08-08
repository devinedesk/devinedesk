import React, { useState, useEffect } from 'react';
import { LocalModelManager } from './LocalModelManager.jsx';
import { isLocalAIAvailable } from '../../../../src/lib/localInferenceClient.js';
import { t } from '../../../../src/lib/i18n.js';
import { useSettings } from '../contexts/SettingsContext.jsx';
import { Button } from '../../../../components/ui/Button.jsx';
import { Input } from '../../../../components/ui/Input.jsx';

export function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('api');
  const { keys: contextKeys, updateMultipleKeys } = useSettings();

  // Form State
  const [keys, setKeys] = useState(contextKeys);

  useEffect(() => {
    setKeys(contextKeys);
  }, [contextKeys]);

  const handleChange = (key) => (e) => {
    setKeys((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = () => {
    updateMultipleKeys(keys);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] px-4 font-sans backdrop-blur-sm">
      <div className="bg-panel-bg border border-muted rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-3xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-muted bg-card-bg shrink-0">
          <h2 className="text-xl font-bold text-white m-0 tracking-tight">
            {t('settings.title') || 'Settings'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-white rounded-full p-2 transition-colors hover:bg-muted/30"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-3 border-b border-muted shrink-0 bg-card-bg">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
              activeTab === 'api'
                ? 'bg-panel-bg border-t border-x border-muted text-white'
                : 'text-secondary hover:text-white hover:bg-muted/10'
            }`}
          >
            {t('settings.apiKey') || 'API Keys'}
          </button>
          {isLocalAIAvailable() && (
            <button
              onClick={() => setActiveTab('local')}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all ${
                activeTab === 'local'
                  ? 'bg-panel-bg border-t border-x border-muted text-white'
                  : 'text-secondary hover:text-white hover:bg-muted/10'
              }`}
            >
              {t('settings.localModels') || 'Local Models'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-panel-bg">
          {activeTab === 'api' ? (
            <div className="flex flex-col gap-5 pb-16">
              <p className="text-sm text-secondary mt-2">
                API operations now securely use platform-level credentials and your account credits.
              </p>
            </div>
          ) : (
            <div className="pb-16">
              <LocalModelManager />
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'api' && (
          <div className="p-5 border-t border-muted bg-card-bg shrink-0">
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="secondary">
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleSave} variant="primary">
                {t('common.save') || 'Save'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
