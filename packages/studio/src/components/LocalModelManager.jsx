import React, { useState, useEffect } from 'react';
import { localAI, isLocalAIAvailable } from '../../../../src/lib/localInferenceClient.js';
import { t, tf } from '../../../../src/lib/i18n.js';

// Icons
const DownloadIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);
const TrashIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
const CheckIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function fmtGB(gb) {
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;
}

function BinaryStatusBar({ onStatusChange }) {
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const st = await localAI.getBinaryStatus();
      setStatus(st);
      if (onStatusChange) onStatusChange(st.exists);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLocalAIAvailable()) refresh();
  }, []);

  const handleInstall = async () => {
    setDownloading(true);
    setError('');
    const unsub = localAI.onDownloadProgress((data) => {
      if (data.id !== '__binary__') return;
      setProgress(data.progress);
      setPhase(data.phase);
    });

    try {
      await localAI.downloadBinary();
      unsub();
      setDownloading(false);
      await refresh();
    } catch (err) {
      unsub();
      setError(err.message);
      setDownloading(false);
    }
  };

  if (!status) return null;

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
      <div className="flex flex-col gap-0.5 w-full">
        <span className="text-xs font-bold text-white">sd.cpp inference engine</span>

        {downloading ? (
          <div className="mt-2 w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-primary">
                {phase === 'extracting'
                  ? t('localModels.extracting')
                  : `${t('localModels.downloading')} ${Math.round(progress * 100)}%`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <span
            className={`text-[11px] ${status.exists ? 'text-green-400' : error ? 'text-red-400' : 'text-yellow-400'}`}
          >
            {error
              ? `Error: ${error}`
              : status.exists
                ? t('localModels.installed')
                : t('localModels.notInstalled')}
          </span>
        )}
      </div>

      {!status.exists && !downloading && (
        <button
          onClick={handleInstall}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black transition-all hover:scale-105"
        >
          {error ? t('common.retry') : t('localModels.installEngine')}
        </button>
      )}
    </div>
  );
}

function AuxRow({ label, auxKey, initStatus, onStateChange }) {
  const isReady = initStatus === 'downloaded';
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    const auxId = auxKey === 'llm' ? '__llm__' : '__vae__';

    const unsub = localAI.onDownloadProgress((data) => {
      if (data.id !== auxId) return;
      setProgress(data.progress);
      setPhase(data.phase);
    });

    try {
      await localAI.downloadAuxiliary(auxKey);
      unsub();
      setDownloading(false);
      if (onStateChange) onStateChange();
    } catch (err) {
      unsub();
      setError(err.message);
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 mt-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isReady ? (
            <span className="text-green-400 shrink-0">{CheckIcon}</span>
          ) : (
            <span className="text-yellow-400 shrink-0">!</span>
          )}
          <span className="text-[11px] text-white truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isReady ? (
            <span className="text-[10px] text-green-400">{t('localModels.ready')}</span>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all disabled:opacity-50"
            >
              {downloading ? <span className="animate-spin">◌</span> : DownloadIcon}
              {error
                ? t('common.retry')
                : downloading
                  ? t('localModels.downloading')
                  : t('localModels.get')}
            </button>
          )}
        </div>
      </div>

      {downloading && (
        <div className="w-full mt-1">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted block mt-0.5">
            {phase === 'done'
              ? t('localModels.complete')
              : `${t('localModels.downloading')} ${Math.round(progress * 100)}%`}
          </span>
        </div>
      )}
      {error && !downloading && (
        <span className="text-[10px] text-red-400 block mt-0.5">Error: {error}</span>
      )}
    </div>
  );
}

function Wan2gpConfigBar({ onChange }) {
  const [url, setUrl] = useState('');
  const [statusText, setStatusText] = useState(t('localModels.notConfigured'));
  const [statusKind, setStatusKind] = useState('muted');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateStatus = (text, kind = 'muted') => {
    setStatusText(text);
    setStatusKind(kind);
  };

  useEffect(() => {
    let mounted = true;
    localAI.getWan2gpConfig().then(async (cfg) => {
      if (!mounted) return;
      if (cfg.url) {
        setUrl(cfg.url);
        const r = await localAI.probeWan2gp(cfg.url);
        if (!mounted) return;
        updateStatus(
          r.ok ? `Connected · Gradio ${r.version}` : `Saved URL not reachable: ${r.error}`,
          r.ok ? 'ok' : 'warn'
        );
      } else {
        updateStatus(t('localModels.notConfiguredNote'), 'muted');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleTest = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      updateStatus('Enter a URL first', 'warn');
      return;
    }
    updateStatus(t('localModels.probing'), 'muted');
    setTesting(true);
    try {
      const r = await localAI.probeWan2gp(trimmed);
      updateStatus(
        r.ok ? `Reachable · Gradio ${r.version}` : `Unreachable: ${r.error}`,
        r.ok ? 'ok' : 'err'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    setSaving(true);
    try {
      await localAI.setWan2gpUrl(trimmed);
      const r = trimmed ? await localAI.probeWan2gp(trimmed) : { ok: false, error: 'cleared' };
      updateStatus(
        r.ok
          ? `Saved · Connected to Gradio ${r.version}`
          : trimmed
            ? `Saved, not reachable: ${r.error}`
            : 'Cleared',
        r.ok ? 'ok' : 'warn'
      );
      if (onChange) onChange();
    } finally {
      setSaving(false);
    }
  };

  const statusColor =
    {
      muted: 'text-white/40',
      ok: 'text-green-400',
      warn: 'text-yellow-400',
      err: 'text-red-400',
    }[statusKind] || 'text-white/40';

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mt-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-white">Wan2GP server (optional)</span>
        <span className="text-[11px] text-white/50 leading-relaxed">
          Run{' '}
          <a
            href="https://github.com/deepbeepmeep/Wan2GP"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Wan2GP
          </a>{' '}
          on a CUDA box (<code>python wgp.py --listen --server-name 0.0.0.0</code>) to unlock video
          models from this UI.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="http://127.0.0.1:7860"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 focus:border-primary/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"
        />
        <button
          onClick={handleTest}
          disabled={testing || saving}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all disabled:opacity-50"
        >
          {testing ? '...' : 'Test'}
        </button>
        <button
          onClick={handleSave}
          disabled={testing || saving}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:scale-105 transition-all disabled:opacity-50"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>
      <div className={`text-[11px] ${statusColor}`}>{statusText}</div>
    </div>
  );
}

function ModelCard({ model, onStateChange }) {
  const isDownloaded = model.state === 'downloaded';
  const auxStatus = model.auxiliaryStatus || {};
  const auxReady =
    !model.requiresAuxiliary || (auxStatus.llm === 'downloaded' && auxStatus.vae === 'downloaded');
  const fullyReady = isDownloaded && auxReady;
  const isWan2gp = model.provider === 'wan2gp';

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');

  if (isWan2gp) {
    const ready = !!model.ready;
    return (
      <div className="flex items-start justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{model.name}</span>
            {ready && <span className="text-green-400">{CheckIcon}</span>}
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">{model.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${model.type === 'video' ? 'bg-purple-500/15 text-purple-300' : 'bg-primary/10 text-primary'}`}
            >
              {model.type.toUpperCase()}
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white/60">
              via Wan2GP
            </span>
            {(model.tags || [])
              .filter((t) => !['featured', 'remote'].includes(t))
              .map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white/60"
                >
                  {t}
                </span>
              ))}
          </div>
        </div>
        <div className="shrink-0">
          <span className={`text-[10px] font-bold ${ready ? 'text-green-400' : 'text-yellow-400'}`}>
            {ready ? t('localModels.available') : t('localModels.offline')}
          </span>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    const unsub = localAI.onDownloadProgress((data) => {
      if (data.id !== model.id) return;
      setProgress(data.progress);
      setPhase(data.phase);
    });

    try {
      await localAI.downloadModel(model.id);
      unsub();
      setDownloading(false);
      if (onStateChange) onStateChange();
    } catch (err) {
      unsub();
      setError(err.message);
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(tf('localModels.deleteConfirm', model.name))) return;
    try {
      await localAI.deleteModel(model.id);
      if (onStateChange) onStateChange();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">{model.name}</span>
            {model.featured && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-primary/20 text-primary border border-primary/30">
                {t('localModels.featured')}
              </span>
            )}
            {fullyReady && <span className="text-green-400">{CheckIcon}</span>}
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">{model.description}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
              {model.type.toUpperCase()}
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white/60">
              {fmtGB(model.sizeGB)}
            </span>
            {(model.tags || [])
              .filter((t) => t !== 'featured')
              .map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white/60"
                >
                  {t}
                </span>
              ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDownloaded ? (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            >
              {TrashIcon}
            </button>
          ) : (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:scale-105 transition-all disabled:opacity-50"
            >
              {downloading ? <span className="animate-spin">◌</span> : DownloadIcon}
              {error
                ? t('common.retry')
                : downloading
                  ? t('localModels.downloading')
                  : t('localModels.download')}
            </button>
          )}
        </div>
      </div>

      {downloading && (
        <div className="w-full">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-white/40 block mt-1">
            {phase === 'done'
              ? t('localModels.complete')
              : `${t('localModels.downloading')} ${Math.round(progress * 100)}%`}
          </span>
        </div>
      )}
      {error && !downloading && (
        <span className="text-[10px] text-red-400 block mt-1">Error: {error}</span>
      )}

      {model.requiresAuxiliary && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5 mt-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
            {t('localModels.requiredComponents')}
          </span>
          <AuxRow
            label="Qwen3-4B Text Encoder (2.4 GB)"
            auxKey="llm"
            initStatus={auxStatus.llm}
            onStateChange={onStateChange}
          />
          <AuxRow
            label="FLUX VAE (335 MB)"
            auxKey="vae"
            initStatus={auxStatus.vae}
            onStateChange={onStateChange}
          />
        </div>
      )}
    </div>
  );
}

export function LocalModelManager() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageInfo, setStorageInfo] = useState(t('localModels.checkingStorage'));
  const [storageTitle, setStorageTitle] = useState('');

  const fetchModels = async () => {
    try {
      setLoading(true);
      const m = await localAI.listModels();
      setModels(m);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshStorageInfo = async () => {
    try {
      const status = await localAI.getBinaryStatus();
      const storagePath = status.modelsDir || status.dataDir;
      setStorageInfo(
        storagePath ? `${t('localModels.storedIn')} ${storagePath}` : t('localModels.storedDefault')
      );
      if (storagePath && status.envVar) {
        setStorageTitle(`Set ${status.envVar} before launch to change this location`);
      }
    } catch (_) {
      setStorageInfo(t('localModels.storedDefault'));
    }
  };

  useEffect(() => {
    if (isLocalAIAvailable()) {
      refreshStorageInfo();
      fetchModels();
    }
  }, []);

  if (!isLocalAIAvailable()) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm font-bold text-white">{t('localModels.title')}</p>
          <p className="text-xs text-white/40 max-w-xs">{t('localModels.webOnly')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {t('localModels.inferenceEngine')}
        </h3>
        <BinaryStatusBar onStatusChange={fetchModels} />
        <Wan2gpConfigBar onChange={fetchModels} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider shrink-0">
            {t('localModels.title')}
          </h3>
          <span
            title={storageTitle}
            className="min-w-0 truncate text-right text-[10px] text-white/40"
          >
            {storageInfo}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-xs text-white/40 text-center py-4">{t('localModels.loading')}</div>
          ) : error ? (
            <div className="text-xs text-red-400 text-center py-4">
              {t('localModels.errorLoading')} {error}
            </div>
          ) : (
            models.map((m) => <ModelCard key={m.id} model={m} onStateChange={fetchModels} />)
          )}
        </div>
      </div>
    </div>
  );
}
