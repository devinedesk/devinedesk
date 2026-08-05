"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { generateImage, generateI2I, uploadFile } from "../apiClient.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import DrawModal from "./DrawModal.jsx";
import MobileGenerationActions, {
  GenerationCopyButtons,
} from "./MobileGenerationActions.jsx";
import AdvancedOptionsPanel from "./AdvancedOptionsPanel.jsx";
import { SettingsContext } from "../contexts/SettingsContext.jsx";
import { useDatabaseSync } from "../hooks/useDatabaseSync.js";
import QuickToolsPanel from "./QuickToolsPanel.jsx";
import { localAI, isLocalAIAvailable } from "../../../../src/lib/localInferenceClient.js";
import { LOCAL_MODEL_CATALOG, getLocalModelById } from "../../../../src/lib/localModels.js";
import {
  t2iModels,
  i2iModels,
  getAspectRatiosForModel,
  getResolutionsForModel,
  getQualityFieldForModel,
  getAspectRatiosForI2IModel,
  getResolutionsForI2IModel,
  getQualityFieldForI2IModel,
  getMaxImagesForI2IModel,
  getEffectsForI2IModel,
  getDefaultEffectForI2IModel,
  getI2IModelById,
} from "../models.js";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PROMPT_MEDIA_PREVIEW_CLASS,
  PromptAspectRatioIcon,
  PromptAction,
  PromptChevronIcon,
  PromptComposer,
  PromptControls,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
  PromptQualityIcon,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";

// ─── helpers ────────────────────────────────────────────────────────────────

async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// ─── UploadButton (inline picker) ───────────────────────────────────────────

function UploadButton({ apiKey, maxImages, onSelect, onClear, initialUrls = [], label = null, persistedHistory = null, onHistoryChange = null }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState(persistedHistory || []); // [{id, name, url, thumbnail}]

  // Notify parent whenever uploadHistory changes (for localStorage persistence)
  const onHistoryChangeRef = useRef(onHistoryChange);
  onHistoryChangeRef.current = onHistoryChange;
  useEffect(() => {
    onHistoryChangeRef.current?.(uploadHistory);
  }, [uploadHistory]);

  // Sync if parent provides a new persistedHistory (e.g. on first mount from localStorage)
  useEffect(() => {
    if (persistedHistory && persistedHistory.length > 0) {
      setUploadHistory((prev) => {
        // Merge: add any entries from persistedHistory that aren't already present
        const existingUrls = new Set(prev.map(h => h.url));
        const missing = persistedHistory.filter(h => h.url && !existingUrls.has(h.url));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
    }
  }, [persistedHistory]);
  
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      // Avoid infinite loops by only updating if URLs actually changed
      const currentUrls = selectedEntries.map(e => e.url);
      const isSame = initialUrls.length === currentUrls.length && initialUrls.every(u => currentUrls.includes(u));
      if (isSame) return;

      const newEntries = initialUrls.map(url => ({ url }));
      setSelectedEntries(newEntries);
      
      // Also ensure they are in the history panel
      setUploadHistory(prev => {
        const existingUrls = prev.map(h => h.url);
        const missing = initialUrls
          .filter(u => !existingUrls.includes(u))
          .map(u => ({ id: `restored-${u}`, name: "Restored Image", url: u, progress: 100 }));
        return [...missing, ...prev];
      });
    }
  }, [initialUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear?.();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((e) => e.url);
      onSelect({ url: urls[0], urls, thumbnail: entries[0].url });
    },
    [onSelect],
  );

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `The following images are too large (max 10MB): ${tooLarge.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setUploading(true);
    try {
      const toUpload =
        maxImages === 1
          ? files.slice(0, 1)
          : files.slice(0, maxImages - selectedEntries.length || 1);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();

          // Add a placeholder to history immediately without local preview
          const placeholder = { id, name: file.name, url: null, progress: 0 };
          setUploadHistory((prev) => [placeholder, ...prev]);

          try {
            const uploadedUrl = await uploadFile(apiKey, file, (pct) => {
              setLastUploadProgress(pct);
              setUploadHistory((prev) =>
                prev.map((h) => (h.id === id ? { ...h, progress: pct } : h)),
              );
            });

            // Update history with real URL and Mark as 100%
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return { ...h, url: uploadedUrl, progress: 100 };
                }
                return h;
              }),
            );

            // Auto-select if there's room
            if (selectedEntries.length < maxImages) {
              const newEntry = { url: uploadedUrl };
              setSelectedEntries((prev) => [...prev, newEntry]);

              if (maxImages === 1) {
                fireOnSelect([newEntry]);
                setPanelOpen(false);
              }
            }
          } catch (err) {
            console.error("[UploadButton] Upload failed for", file.name, err);
            setUploadHistory((prev) => prev.filter((h) => h.id !== id));
            throw err;
          }
        }),
      );
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
    }
  };

  const handleCellClick = (entry) => {
    const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
    const isSelected = selIdx !== -1;
    const atMax =
      maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) onClear?.();
      } else {
        next = [
          ...selectedEntries,
          { url: entry.url, localUrl: entry.localUrl },
        ];
      }
      setSelectedEntries(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));

    const next = selectedEntries.filter((s) => s.url !== entry.url);
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      if (next.length === 0) onClear?.();
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern — parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  const triggerContent = uploading ? (
    <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
      <svg className="w-8 h-8 -rotate-90">
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={88}
          strokeDashoffset={88 - (88 * lastUploadProgress) / 100}
          className="text-[#22d3ee] transition-all duration-300"
        />
      </svg>
      <span className="absolute text-[9px] font-black text-[#22d3ee] leading-none">
        {lastUploadProgress}%
      </span>
    </div>
  ) : label === "Swap Face" ? (
    hasSelection ? (
      <img src={selectedEntries[0].url} alt="" className="w-full h-full object-cover" />
    ) : (
      <span className="text-[10px] font-bold text-white/50">Face</span>
    )
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="text-white/60 group-hover:text-[#22d3ee] transition-colors"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  const defaultLabel = isMulti ? `Add up to ${maxImages} images` : "Reference image";
  const triggerTitle = hasSelection
    ? count > 1
      ? `${count} of ${maxImages} images selected — click to manage`
      : isMulti
        ? `1 image selected — click to add more (up to ${maxImages})`
        : label || "Reference image"
    : label || defaultLabel;

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={promptMediaButtonClassName({
          active: hasSelection,
        })}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <PromptPopover
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="w-96 max-w-[calc(100vw-2rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-secondary">
                Reference Images
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  Select up to {maxImages} images
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  ✓ Done ({count})
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "Upload files" : "Upload new"}
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">No uploads yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const selIdx = selectedEntries.findIndex(
                  (e) => e.url === entry.url,
                );
                const isSelected = selIdx !== -1;
                const atMax =
                  isMulti && !isSelected && selectedEntries.length >= maxImages;

                return (
                  <div
                    key={entry.id}
                    title={entry.name}
                    onClick={() => entry.url && handleCellClick(entry)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ${
                      isSelected
                        ? "border-primary shadow-glow"
                        : "border-white/10 hover:border-white/30"
                    } ${atMax ? "opacity-40 cursor-not-allowed" : ""} ${!entry.url ? "cursor-wait" : ""}`}
                  >
                    {entry.url ? (
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1" />
                        <span className="text-[10px] font-black text-primary">
                          {entry.progress}%
                        </span>
                      </div>
                    )}

                    {/* Hover overlay with delete */}
                    {entry.url && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1">
                        <button
                          type="button"
                          title="Remove from history"
                          onClick={(e) => handleRemoveFromHistory(e, entry)}
                          className="w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors"
                        >
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Selection badge */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1">
                        {isMulti ? (
                          <span className="text-[10px] font-black text-black">
                            {selIdx + 1}
                          </span>
                        ) : (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom bar for multi-select */}
          {isMulti && hasSelection && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-secondary">
                {count} of {maxImages} selected
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
              >
                Use Selected
              </button>
            </div>
          )}
        </PromptPopover>
      )}
    </div>
  );
}

// ─── ModelDropdown ────────────────────────────────────────────────────────────

const PROVIDER_LOGOS = {
  openai: "https://cdn.api.ai/models/openai.png",
  google: "https://cdn.api.ai/models/gemini.png",
  kling: "https://cdn.api.ai/models/kling.png",
  alibaba: "https://cdn.api.ai/models/alibaba.png",
  bytedance: "https://cdn.api.ai/models/bytedance.png",
  blackforest: "https://cdn.api.ai/models/bfl.png",
  minimax: "https://cdn.api.ai/models/minimax.png",
  suno: "https://cdn.api.ai/models/suno.png",
  anthropic: "https://cdn.api.ai/models/claude.png",
  meshy: "https://cdn.api.ai/models/meshy-3.png",
  tripo3d: "https://cdn.api.ai/models/tripo3d.png",
  grok: "https://cdn.api.ai/models/xai.png",
  platform: "https://cdn.api.ai/models/api.png",
  midjourney: "https://cdn.api.ai/models/midjourney.png",
  vidu: "https://cdn.api.ai/models/vidu.png",
  runway: "https://cdn.api.ai/models/runway.png",
  luma: "https://cdn.api.ai/models/luma.png",
  ideogram: "https://cdn.api.ai/models/ideogram.png",
  leonardoai: "https://cdn.api.ai/models/leonardoai.png",
  hunyuan: "https://cdn.api.ai/models/hunyuan.png",
  hidream: "https://cdn.api.ai/models/hidream.png",
  lightricks: "https://cdn.api.ai/models/lightricks.png",
  pixverse: "https://cdn.api.ai/models/pixverse.png",
  reve: "https://cdn.api.ai/models/reve.png",
  stability: "https://cdn.api.ai/models/stability.png"
};

const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];

function ModelDropdown({ models, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  
  // Find current model's provider to pre-select the provider tab ("slide")
  const currentModelObj = models.find((m) => m.id === selectedModel);
  const initialProvider = currentModelObj?.provider || "all";
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);

  const activeItemRef = useRef(null);

  useEffect(() => {
    // Automatically scroll the active model into view when opening
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, []);

  // Sync with DB
  useDatabaseSync(PERSIST_KEY, {
    prompt,
    negativePrompt,
    aspectRatio,
    numOutputs,
    outputFormat,
    customModel,
    width,
    height,
    advancedParams,
    loras,
    useLocalModel,
    uploadHistory
  }, (dbState) => {
    if (dbState.prompt !== undefined) setPrompt(dbState.prompt);
    if (dbState.negativePrompt !== undefined) setNegativePrompt(dbState.negativePrompt);
    if (dbState.aspectRatio !== undefined) setAspectRatio(dbState.aspectRatio);
    if (dbState.numOutputs !== undefined) setNumOutputs(dbState.numOutputs);
    if (dbState.outputFormat !== undefined) setOutputFormat(dbState.outputFormat);
    if (dbState.customModel !== undefined) setCustomModel(dbState.customModel);
    if (dbState.width !== undefined) setWidth(dbState.width);
    if (dbState.height !== undefined) setHeight(dbState.height);
    if (dbState.advancedParams !== undefined) setAdvancedParams(dbState.advancedParams);
    if (dbState.loras !== undefined) setLoras(dbState.loras);
    if (dbState.useLocalModel !== undefined) setUseLocalModel(dbState.useLocalModel);
    if (dbState.uploadHistory !== undefined) setUploadHistory(dbState.uploadHistory);
  });

  const getProviderStyle = (provider) => {
    switch (provider) {
      case "local":
        return { text: "L", bg: "bg-green-500/10 text-green-400 border-green-500/25" };
      case "grok":
        return { text: "xI", bg: "bg-orange-500/10 text-orange-400 border-orange-500/25" };
      case "openai":
        return { text: "O", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" };
      case "google":
        return { text: "G", bg: "bg-blue-500/10 text-blue-400 border-blue-500/25" };
      case "blackforest":
        return { text: "BF", bg: "bg-amber-500/10 text-amber-400 border-amber-500/25" };
      case "bytedance":
        return { text: "BD", bg: "bg-purple-500/10 text-purple-400 border-purple-500/25" };
      case "midjourney":
        return { text: "MJ", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" };
      case "kling":
        return { text: "KL", bg: "bg-rose-500/10 text-rose-400 border-rose-500/25" };
      case "vidu":
        return { text: "VD", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" };
      case "minimax":
        return { text: "MX", bg: "bg-pink-500/10 text-pink-400 border-pink-500/25" };
      case "ideogram":
        return { text: "ID", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" };
      case "luma":
        return { text: "LM", bg: "bg-teal-500/10 text-teal-400 border-teal-500/25" };
      case "alibaba":
        return { text: "AL", bg: "bg-sky-500/10 text-sky-400 border-sky-500/25" };
      case "leonardoai":
        return { text: "LE", bg: "bg-violet-500/10 text-violet-400 border-violet-500/25" };
      case "stability":
        return { text: "SD", bg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25" };
      default:
        const name = provider ? provider.toUpperCase() : "AI";
        return { text: name.substring(0, 2), bg: "bg-primary/10 text-primary border-primary/25" };
    }
  };

  // Dynamically compute list of providers from the input models list
  const availableProviders = [];
  const seenProviders = new Set();
  
  models.forEach(m => {
    const pId = m.provider || (useLocalModel ? 'local' : 'Local API');
    const pName = m.provider_name || (useLocalModel ? 'Local Inference' : 'Local API');
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({ id: pId, name: pName });
    }
  });

  const filtered = models.filter((m) => {
    // 1. Filter by provider tab
    if (selectedProvider !== "all") {
      const pId = m.provider || (useLocalModel ? 'local' : 'Local API');
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    const query = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query)
    );
  });

  const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];

  return (
    <div className="flex gap-4 h-full max-h-[60vh] min-h-[350px] overflow-x-hidden">
      {/* Left Sidebar: Provider tabs */}
      <div className="flex flex-col gap-2.5 items-center pr-2 border-r border-white/5 shrink-0 select-none overflow-y-auto custom-scrollbar w-14 pt-0.5">
        <button
          type="button"
          onClick={() => setSelectedProvider("all")}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ${
            selectedProvider === "all"
              ? "bg-white/10 text-yellow-400 border-yellow-500/30 shadow-md scale-105"
              : "bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white"
          }`}
          title="All Providers"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={selectedProvider === "all" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        
        {availableProviders.map(p => {
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
                  : "bg-white/[0.02] text-white/60 border-white/[0.02] hover:bg-white/5 hover:text-white/80"
              }`}
              title={p.name}
            >
              {PROVIDER_LOGOS[p.id] ? (
                <img
                  src={PROVIDER_LOGOS[p.id]}
                  alt={p.name}
                  className={`w-full h-full rounded-full object-contain ${invertLogos.includes(p.id) ? "invert" : ""}`}
                />
              ) : (
                style.text
              )}
            </button>
          );
        })}
      </div>

      {/* Right Pane: Search input + Models list */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="border-b border-white/5 shrink-0 pb-2">
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
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="text-xs font-semibold text-secondary py-1 shrink-0 flex items-center justify-between">
          <span>Available models</span>
          {selectedProvider !== "all" && (
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60">
              {availableProviders.find(p => p.id === selectedProvider)?.name || selectedProvider}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-xs text-white/60 text-center py-6">
              No models found
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                ref={selectedModel === m.id ? activeItemRef : null}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(m);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/5 ${
                  selectedModel === m.id ? "bg-white/5 border-white/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {PROVIDER_LOGOS[m.provider] ? (
                    <div className="w-8 h-8 rounded-full border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]">
                      <img
                        src={PROVIDER_LOGOS[m.provider]}
                        alt={m.provider_name}
                        className={`w-full h-full object-contain p-1 ${invertLogos.includes(m.provider) ? "invert" : ""}`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-8 h-8 ${
                        useLocalModel 
                          ? (m.featured ? 'bg-primary/10 text-primary border-primary/10' : 'bg-green-500/10 text-green-400 border-green-500/10')
                          : m.family === "kontext"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/10"
                            : m.family === "effects"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/10"
                              : "bg-primary/10 text-primary border-primary/10"
                      } border rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase`}
                    >
                      {useLocalModel && m.featured ? '⚡' : m.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-tight truncate">
                        {m.name}
                      </span>
                      {useLocalModel && m.featured && (
                        <span className="text-[9px] font-black px-1 py-0.5 rounded bg-primary/20 text-primary">FEATURED</span>
                      )}
                    </div>
                    {(selectedProvider === "all" || useLocalModel) && (m.provider_name || m.type) && (
                      <span className="text-[9px] text-white/60">
                        {useLocalModel ? `${m.type?.toUpperCase()} · ${m.family}` : m.provider_name}
                      </span>
                    )}
                  </div>
                </div>
                {selectedModel === m.id && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SimpleDropdown ───────────────────────────────────────────────────────────

function SimpleDropdown({ title, options, selected, onSelect, onClose }) {
  return (
    <>
      <PromptPopoverHeader>{title}</PromptPopoverHeader>
      <PromptMenuList>
        {options.map((opt) => (
          <PromptMenuItem
            key={opt}
            selected={selected === opt}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
          >
            {opt}
          </PromptMenuItem>
        ))}
      </PromptMenuList>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageStudio({
  apiKey,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  const LEGACY_PERSIST_KEY = "hg_image_studio_persistent";
  const PERSIST_KEY = scopedPersistKey(LEGACY_PERSIST_KEY, apiKey);
  useEffect(() => {
    migrateLegacyPersistKey(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

  // ── Model / mode state ──────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState(false); // false=t2i, true=i2i
  const [selectedModelId, setSelectedModelId] = useState(t2iModels[0].id);
  const [selectedModelName, setSelectedModelName] = useState(t2iModels[0].name);
  const [selectedAr, setSelectedAr] = useState(
    t2iModels[0].inputs?.aspect_ratio?.default || "1:1",
  );
  const [selectedQuality, setSelectedQuality] = useState(() => {
    const resolutions = getResolutionsForModel(t2iModels[0].id);
    return resolutions[0] || null;
  });
  const [selectedEffect, setSelectedEffect] = useState("");
  const [maxImages, setMaxImages] = useState(1);

  // ── Local AI State ──────────────────────────────────────────────────────
  const LOCAL_IMAGE_MODELS = LOCAL_MODEL_CATALOG.filter(m => m.type !== 'video');
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [selectedLocalModel, setSelectedLocalModel] = useState(LOCAL_IMAGE_MODELS[0]?.id || null);
  const [localGenProgress, setLocalGenProgress] = useState(0);

  // ── Advanced Options State ──────────────────────────────────────────────
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(25);
  const [seed, setSeed] = useState(-1);
  const [selectedStyle, setSelectedStyle] = useState("None");
  const [customWidth, setCustomWidth] = useState(0);
  const [customHeight, setCustomHeight] = useState(0);
  const [referenceStrength, setReferenceStrength] = useState(50);
  const [selectedLora, setSelectedLora] = useState("");
  const [loraWeight, setLoraWeight] = useState(1.0);

  // ── Prompt / upload state ───────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [swapImageUrl, setSwapImageUrl] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]); // persisted reference images history

  // ── UI state ────────────────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'model' | 'ar' | 'quality' | null
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);

  // ── Canvas / history state ──────────────────────────────────────────────
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [batchSize, setBatchSize] = useState(1);
  const [localHistory, setLocalHistory] = useState([]); // [{id,url,prompt,model,aspect_ratio,timestamp}]

  // Use prop history if provided, otherwise local
  const history = historyItems ?? localHistory;

  // ── Refs ────────────────────────────────────────────────────────────────
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const uploadPickerResetRef = useRef(null); // not used directly — managed via key

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.maxImages) setMaxImages(data.maxImages);
        if (data.prompt) setPrompt(data.prompt);
        if (data.uploadedImageUrls) setUploadedImageUrls(data.uploadedImageUrls);
        if (data.uploadHistory) setUploadHistory(data.uploadHistory);
        if (data.batchSize) setBatchSize(data.batchSize);
        if (data.localHistory) setLocalHistory(data.localHistory);
        if (data.useLocalModel !== undefined) setUseLocalModel(data.useLocalModel);
        if (data.selectedLocalModel) setSelectedLocalModel(data.selectedLocalModel);
        if (data.negativePrompt !== undefined) setNegativePrompt(data.negativePrompt);
        if (data.guidanceScale !== undefined) setGuidanceScale(data.guidanceScale);
        if (data.steps !== undefined) setSteps(data.steps);
        if (data.seed !== undefined) setSeed(data.seed);
        if (data.selectedStyle) setSelectedStyle(data.selectedStyle);
        if (data.customWidth !== undefined) setCustomWidth(data.customWidth);
        if (data.customHeight !== undefined) setCustomHeight(data.customHeight);
        if (data.referenceStrength !== undefined) setReferenceStrength(data.referenceStrength);
        if (data.selectedLora) setSelectedLora(data.selectedLora);
        if (data.loraWeight !== undefined) setLoraWeight(data.loraWeight);
      }
    } catch (err) {
      console.warn("Failed to load ImageStudio persistence:", err);
    }
  }, []);

  // ── Adjust height on load ────────────────────────────────────────────────
  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          selectedModelId,
          selectedModelName,
          selectedAr,
          selectedQuality,
          selectedEffect,
          maxImages,
          prompt,
          uploadedImageUrls,
          uploadHistory,
          batchSize,
          localHistory,
          useLocalModel,
          selectedLocalModel,
          negativePrompt,
          guidanceScale,
          steps,
          seed,
          selectedStyle,
          customWidth,
          customHeight,
          referenceStrength,
          selectedLora,
          loraWeight,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save ImageStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    selectedModelId,
    selectedModelName,
    selectedAr,
    selectedQuality,
    selectedEffect,
    maxImages,
    prompt,
    uploadedImageUrls,
    uploadHistory,
    batchSize,
    localHistory,
  ]);

  const processDroppedImages = async (files) => {
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `The following images are too large (max 10MB): ${tooLarge.map((f) => f.name).join(", ")}`
      );
      return;
    }

    setGenerating(true); // Show as generating/busy
    try {
      const toUpload =
        maxImages === 1 ? files.slice(0, 1) : files.slice(0, maxImages);
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          try {
            return await uploadFile(apiKey, file);
          } catch (err) {
            console.error(
              "[ImageStudio] Drop upload failed for",
              file.name,
              err
            );
            throw err;
          }
        })
      );

      handleUploadSelect({ urls });
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processDroppedImages(imageFiles);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImages]);

  // ── Derived: current model lists & helpers ───────────────────────────────
  const currentModels = imageMode ? i2iModels : t2iModels;
  const currentAspectRatios = imageMode
    ? getAspectRatiosForI2IModel(selectedModelId)
    : getAspectRatiosForModel(selectedModelId);
  const currentResolutions = imageMode
    ? getResolutionsForI2IModel(selectedModelId)
    : getResolutionsForModel(selectedModelId);
  const currentQualityField = imageMode
    ? getQualityFieldForI2IModel(selectedModelId)
    : getQualityFieldForModel(selectedModelId);
  const showQualityBtn = currentResolutions.length > 0;
  const currentEffects = imageMode ? getEffectsForI2IModel(selectedModelId) : [];
  const showEffectBtn = currentEffects.length > 0;

  // ── Textarea auto-resize ─────────────────────────────────────────────────
  // ── Upload picker callbacks ──────────────────────────────────────────────
  const handleUploadSelect = useCallback(
    ({ url, urls }) => {
      const newUrls = urls || [url];
      setUploadedImageUrls(newUrls);

      if (!imageMode) {
        // Find the i2i sibling of the currently selected t2i model.
        // Many models follow conventions, but some have completely irregular names —
        // those are handled via a hardcoded exceptions map.
        const curId = selectedModelId;
        const i2iIds = new Set(i2iModels.map((m) => m.id));

        // Hardcoded exceptions for models with irregular t2i → i2i naming
        const EXCEPTIONS = {
          'reve-text-to-image':          'reve-image-edit',
          'wan2.1-text-to-image':        'wan2.5-image-edit',   // no wan2.1 i2i — closest
          'wan2.5-text-to-image':        'wan2.5-image-edit',
          'wan2.6-text-to-image':        'wan2.6-image-edit',
          'kling-o1-text-to-image':      'kling-o1-edit-image',
          'vidu-q2-text-to-image':       'vidu-q2-reference-to-image',
          'bytedance-seedream-v3':       'bytedance-seededit-v3',
          'bytedance-seedream-v4':       'bytedance-seedream-edit-v4',
          'ideogram-v3-t2i':             'ideogram-v3-reframe',
        };

        const findI2I = (id) => i2iModels.find((m) => m.id === id) ?? null;

        const target =
          // 0. Hardcoded exceptions for irregular names
          findI2I(EXCEPTIONS[curId]) ||
          // 1. Model exists directly in i2i list (e.g. qwen-text-to-image-2512, flux-pulid, flux-redux)
          findI2I(curId) ||
          // 2. {id}-edit suffix (e.g. nano-banana → nano-banana-edit, gpt-image-1.5 → gpt-image-1.5-edit)
          findI2I(`${curId}-edit`) ||
          // 3. -t2i → -i2i (e.g. flux-kontext-dev-t2i → flux-kontext-dev-i2i)
          (curId.includes('-t2i') && findI2I(curId.replace('-t2i', '-i2i'))) ||
          // 4. text-to-image → image-to-image (e.g. gpt4o-text-to-image, midjourney-v7, grok-imagine)
          (curId.includes('text-to-image') && findI2I(curId.replace('text-to-image', 'image-to-image'))) ||
          // 5. Prefix match fallback (e.g. minimax-image-01 → minimax-image-01-subject-reference)
          i2iModels.find((m) => m.id.startsWith(curId)) ||
          // 6. No sibling exists — use first i2i model
          i2iModels[0];

        const ars = getAspectRatiosForI2IModel(target.id);
        const resolutions = getResolutionsForI2IModel(target.id);
        const effects = getEffectsForI2IModel(target.id);
        setImageMode(true);
        setSelectedModelId(target.id);
        setSelectedModelName(target.name);
        setSelectedAr(ars[0] || "1:1");
        setSelectedQuality(resolutions[0] || null);
        setSelectedEffect(effects.length > 0 ? (getDefaultEffectForI2IModel(target.id) || effects[0]) : "");
        setMaxImages(getMaxImagesForI2IModel(target.id));
      }
    },
    [imageMode, selectedModelId],
  );

  const handleUploadClear = useCallback(() => {
    setUploadedImageUrls([]);
    setImageMode(false);

    // Find the t2i parent of the currently selected i2i model (reverse of upload logic)
    const curId = selectedModelId;
    const findT2I = (id) => id ? (t2iModels.find((m) => m.id === id) ?? null) : null;

    // Reverse exceptions map (i2i → t2i for irregular names)
    const REVERSE_EXCEPTIONS = {
      'reve-image-edit':               'reve-text-to-image',
      'wan2.5-image-edit':             'wan2.5-text-to-image',
      'wan2.6-image-edit':             'wan2.6-text-to-image',
      'kling-o1-edit-image':           'kling-o1-text-to-image',
      'vidu-q2-reference-to-image':    'vidu-q2-text-to-image',
      'bytedance-seededit-v3':         'bytedance-seedream-v3',
      'bytedance-seedream-edit-v4':    'bytedance-seedream-v4',
      'ideogram-v3-reframe':           'ideogram-v3-t2i',
    };

    const target =
      // 0. Hardcoded reverse exceptions
      findT2I(REVERSE_EXCEPTIONS[curId]) ||
      // 1. Model exists directly in t2i list (e.g. qwen-text-to-image-2512, flux-pulid, flux-redux)
      findT2I(curId) ||
      // 2. Strip -edit suffix (e.g. nano-banana-edit → nano-banana, gpt-image-1.5-edit → gpt-image-1.5)
      (curId.endsWith('-edit') && findT2I(curId.slice(0, -5))) ||
      // 3. -i2i → -t2i (e.g. flux-kontext-dev-i2i → flux-kontext-dev-t2i)
      (curId.includes('-i2i') && findT2I(curId.replace('-i2i', '-t2i'))) ||
      // 4. image-to-image → text-to-image (e.g. gpt4o-image-to-image → gpt4o-text-to-image)
      (curId.includes('image-to-image') && findT2I(curId.replace('image-to-image', 'text-to-image'))) ||
      // 5. No parent found — use first t2i model
      t2iModels[0];

    const ars = getAspectRatiosForModel(target.id);
    const resolutions = getResolutionsForModel(target.id);
    setSelectedModelId(target.id);
    setSelectedModelName(target.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedEffect("");
    setMaxImages(1);
  }, [selectedModelId]);

  // ── Model selection ──────────────────────────────────────────────────────
  const handleModelSelect = (m) => {
    if (useLocalModel) {
      setSelectedLocalModel(m.id);
      setSelectedModelName(m.name);
      setSelectedAr(m.aspectRatios?.[0] || "1:1");
      return;
    }

    const ars = imageMode
      ? getAspectRatiosForI2IModel(m.id)
      : getAspectRatiosForModel(m.id);
    const resolutions = imageMode
      ? getResolutionsForI2IModel(m.id)
      : getResolutionsForModel(m.id);
    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSwapImageUrl(null);
    if (imageMode) {
      setMaxImages(getMaxImagesForI2IModel(m.id));
      const effects = getEffectsForI2IModel(m.id);
      setSelectedEffect(effects.length > 0 ? (getDefaultEffectForI2IModel(m.id) || effects[0]) : "");
    } else {
      setSelectedEffect("");
    }
  };

  // ── History helpers ──────────────────────────────────────────────────────
  const addToHistory = useCallback(
    (entry) => {
      if (!historyItems) {
        setLocalHistory((prev) => [entry, ...prev.slice(0, 49)]);
      }
      setActiveHistoryIdx(0);
      setCurrentImageUrl(entry.url);
    },
    [historyItems],
  );

  // ── View state ─────────────────────────────────────

  const resetToPrompt = () => {
    setCurrentImageUrl(null);
    setPrompt("");
    setUploadedImageUrls([]);
    setImageMode(false);
    const firstT2I = t2iModels[0];
    const ars = getAspectRatiosForModel(firstT2I.id);
    const resolutions = getResolutionsForModel(firstT2I.id);
    setSelectedModelId(firstT2I.id);
    setSelectedModelName(firstT2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedEffect("");
    setMaxImages(1);
  };

  // ── Generation ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (generating) return;

    if (imageMode) {
      if (uploadedImageUrls.length === 0) {
        alert("Please upload a reference image first.");
        return;
      }
      const modelInfo = getI2IModelById(selectedModelId);
      if (modelInfo?.swapField && !swapImageUrl) {
        alert("Please upload a swap face image.");
        return;
      }
    } else {
      if (!prompt.trim()) {
        alert("Please enter a prompt to generate an image.");
        return;
      }
    }

    onGenerationStart?.();
    setGenerating(true);
    setGenerateError(null);

    try {
      const results = await Promise.all(
        Array.from({ length: batchSize }).map(async () => {
          if (useLocalModel) {
            return new Promise((resolve, reject) => {
              const unsub = localAI.onProgress(({ progress, status, message }) => {
                const pct = Math.round((progress ?? 0) * 100);
                setLocalGenProgress(pct);
              });
              
              localAI.generate({
                model: selectedLocalModel,
                prompt: prompt.trim(),
                negative_prompt: negativePrompt || undefined,
                aspect_ratio: selectedAr,
                steps: steps,
                guidance_scale: guidanceScale,
                seed,
              }).then(res => {
                unsub();
                setLocalGenProgress(0);
                resolve(res);
              }).catch(err => {
                unsub();
                setLocalGenProgress(0);
                reject(err);
              });
            });
          }

          if (imageMode) {
            const genParams = {
              model: selectedModelId,
              images_list: uploadedImageUrls,
              image_url: uploadedImageUrls[0],
              aspect_ratio: selectedAr,
              negative_prompt: negativePrompt || undefined,
              steps: steps,
              guidance_scale: guidanceScale,
              seed,
              lora_model: selectedLora || undefined,
              lora_strength: loraWeight,
            };
            if (swapImageUrl) genParams.swap_url = swapImageUrl;
            if (prompt.trim()) genParams.prompt = prompt.trim();
            if (currentQualityField && selectedQuality) {
              genParams[currentQualityField] = selectedQuality;
            }
            if (showEffectBtn && selectedEffect) genParams.name = selectedEffect;
            if (customWidth > 0 && customHeight > 0) {
              genParams.width = customWidth;
              genParams.height = customHeight;
            }
            if (referenceStrength !== 50) {
              genParams.image_weight = referenceStrength / 100;
            }
            return await generateI2I(apiKey, genParams);
          } else {
            const genParams = {
              model: selectedModelId,
              prompt: prompt.trim(),
              aspect_ratio: selectedAr,
              negative_prompt: negativePrompt || undefined,
              steps: steps,
              guidance_scale: guidanceScale,
              seed,
              lora_model: selectedLora || undefined,
              lora_strength: loraWeight,
            };
            if (currentQualityField && selectedQuality) {
              genParams[currentQualityField] = selectedQuality;
            }
            if (customWidth > 0 && customHeight > 0) {
              genParams.width = customWidth;
              genParams.height = customHeight;
            }
            return await generateImage(apiKey, genParams);
          }
        })
      );

      results.forEach((res) => {
        if (res && res.url) {
          const entry = {
            id: res.id || Math.random().toString(36).substring(7),
            url: res.url,
            prompt: prompt.trim(),
            model: useLocalModel ? `local:${selectedLocalModel}` : selectedModelId,
            aspect_ratio: selectedAr,
            timestamp: new Date().toISOString(),
          };
          addToHistory(entry);
          onGenerationComplete?.({
            url: res.url,
            model: useLocalModel ? `local:${selectedLocalModel}` : selectedModelId,
            prompt: prompt.trim(),
            type: "image",
          });
        }
      });
    } catch (e) {
      console.error("[ImageStudio] Generation failed:", e);
      const errMsg = formatErrorMessage(e, "Image generation failed");
      if (onGenerationError) onGenerationError(errMsg);
      else toast.error(errMsg);
    } finally {
      setGenerating(false);
      onGenerationEnd?.();
    }
  };

  const placeholderText =
    uploadedImageUrls.length > 1
      ? `${uploadedImageUrls.length} images selected — describe the transformation (optional)`
      : imageMode
        ? "Describe how to transform this image (optional)"
        : "Describe the image you want to create";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => setFullscreenUrl(entry.url)}
              >
                <img
                  src={entry.url}
                  alt={entry.prompt?.substring(0, 30) || "Generated image"}
                  className="w-full aspect-square object-cover bg-black/40 hover:opacity-80 transition-opacity"
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GenerationCopyButtons
                    prompt={entry.prompt}
                    imageUrl={entry.url}
                    onCopyError={onGenerationError}
                  />
                  <button
                    type="button"
                    title="Download"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(entry.url, `Local API-${entry.id || idx}.jpg`);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this generated item?")) {
                        setLocalHistory(prev => prev.filter((_, i) => i !== idx));
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <MobileGenerationActions
                  prompt={entry.prompt}
                  imageUrl={entry.url}
                  onCopyError={onGenerationError}
                  actions={[
                    {
                      kind: "download",
                      label: "Download",
                      onSelect: () =>
                        downloadImage(entry.url, `Local API-${entry.id || idx}.jpg`),
                    },
                    {
                      kind: "delete",
                      label: "Delete",
                      danger: true,
                      onSelect: () => {
                        if (confirm("Are you sure you want to delete this generated item?")) {
                          setLocalHistory((prev) => prev.filter((_, i) => i !== idx));
                        }
                      },
                    },
                  ]}
                />

                {/* Prompt & Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <p className="text-white/70 text-xs line-clamp-3 leading-relaxed" title={entry.prompt}>
                    {entry.prompt || "No prompt provided"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 capitalize">
                        {entry.model?.replace("-", " ") || "Image Studio"}
                      </span>
                      <span className="text-[10px] text-white/60">{entry.aspect_ratio}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            {/* Overlapping floating cards */}
            <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100">
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif"
                  alt="Creative asset 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif"
                  alt="Creative asset 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif"
                  alt="Creative asset 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif"
                  alt="Creative asset 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center">
              <span className="text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90">START CREATING WITH</span>
              <span className="text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight">
                {selectedModelName}
              </span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
              Describe a scene, character, mood, or style — and watch it come to life
            </p>
          </div>
        )}
      </div>

      {/* ── PANELS ── */}
      <div className="w-full max-w-4xl mx-auto px-4 z-10 flex flex-col gap-4 mb-4">
        {showToolsPanel && (
          <QuickToolsPanel 
            onClose={() => setShowToolsPanel(false)}
            onSelectStarter={(p) => setPrompt(p)}
            onUseEnhancedPrompt={(p) => setPrompt(p)}
          />
        )}
        {showAdvanced && (
          <AdvancedOptionsPanel 
            onClose={() => setShowAdvanced(false)}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
            guidanceScale={guidanceScale}
            setGuidanceScale={setGuidanceScale}
            steps={steps}
            setSteps={setSteps}
            seed={seed}
            setSeed={setSeed}
            batchCount={batchSize}
            setBatchCount={setBatchSize}
            customWidth={customWidth}
            setCustomWidth={setCustomWidth}
            customHeight={customHeight}
            setCustomHeight={setCustomHeight}
            referenceStrength={referenceStrength}
            setReferenceStrength={setReferenceStrength}
            selectedLora={selectedLora}
            setSelectedLora={setSelectedLora}
            loraWeight={loraWeight}
            setLoraWeight={setLoraWeight}
            isI2I={imageMode}
          />
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <PromptComposer>
          {/* Top row: upload picker + textarea */}
          <div className="flex flex-col gap-3">
            {/* Inline list of uploaded files */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {uploadedImageUrls && uploadedImageUrls.length > 0 && uploadedImageUrls.map((url, idx) => (
                <div key={url} className={PROMPT_MEDIA_PREVIEW_CLASS}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const next = uploadedImageUrls.filter((_, i) => i !== idx);
                      setUploadedImageUrls(next);
                      if (next.length === 0) handleUploadClear();
                    }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white/85 hover:text-white text-[8px] border border-white/5"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Main Upload Trigger */}
              {uploadedImageUrls.length < maxImages && (
                <UploadButton
                  apiKey={apiKey}
                  maxImages={maxImages}
                  onSelect={handleUploadSelect}
                  onClear={handleUploadClear}
                  initialUrls={uploadedImageUrls}
                  persistedHistory={uploadHistory}
                  onHistoryChange={setUploadHistory}
                />
              )}

              {/* Swap Image Upload Trigger */}
              {imageMode && getI2IModelById(selectedModelId)?.swapField && (
                <UploadButton
                  apiKey={apiKey}
                  maxImages={1}
                  onSelect={({ urls }) => setSwapImageUrl(urls[0] || null)}
                  onClear={() => setSwapImageUrl(null)}
                  initialUrls={swapImageUrl ? [swapImageUrl] : []}
                  label="Swap Face"
                />
              )}
            </div>

            {/* Input prompt text area */}
            <PromptTextarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholderText}
            />
          </div>

          {/* Bottom row: controls + generate */}
          <PromptFooter>
            {/* Left controls */}
            <PromptControls ref={dropdownRef}>
              {/* Local AI Toggle (Only if available) */}
              {isLocalAIAvailable() && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextUseLocal = !useLocalModel;
                    setUseLocalModel(nextUseLocal);
                    if (nextUseLocal) {
                      const lm = getLocalModelById(selectedLocalModel);
                      if (lm) setSelectedModelName(lm.name);
                    } else {
                      const apiModel = currentModels.find(m => m.id === selectedModelId);
                      if (apiModel) setSelectedModelName(apiModel.name);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all border text-xs font-bold whitespace-nowrap ${useLocalModel ? 'bg-[#22d3ee]/20 border-[#22d3ee]/40 text-[#22d3ee]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                >
                  {useLocalModel ? 'Local' : 'API'}
                </button>
              )}

              {/* Model button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "model" ? null : "model"));
                  }}
                  className={promptControlClassName({
                    active: dropdownOpen === "model",
                  })}
                >
                  <div className="w-4 h-4 rounded overflow-hidden shrink-0 flex items-center justify-center bg-white/5">
                    {(() => {
                      const selectedModelObj = currentModels.find(m => m.id === selectedModelId);
                      const selectedModelProvider = selectedModelObj?.provider || 'Local API';
                      return PROVIDER_LOGOS[selectedModelProvider] ? (
                        <img 
                          src={PROVIDER_LOGOS[selectedModelProvider]} 
                          alt="" 
                          className={`w-full h-full object-contain ${invertLogos.includes(selectedModelProvider) ? "invert" : ""}`} 
                        />
                      ) : (
                        <span className="text-[9px] font-bold text-black uppercase">G</span>
                      );
                    })()}
                  </div>
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>
                    {selectedModelName}
                  </span>
                  <PromptChevronIcon />
                </button>

                {dropdownOpen === "model" && (
                  <PromptPopover
                    onClick={(e) => e.stopPropagation()}
                    className="w-[calc(100vw-2rem)] md:w-[480px] max-w-md md:max-w-none max-h-[70vh]"
                  >
                    <PromptPopoverHeader>Model</PromptPopoverHeader>
                    <ModelDropdown
                      models={useLocalModel ? LOCAL_IMAGE_MODELS : currentModels}
                      selectedModel={useLocalModel ? selectedLocalModel : selectedModelId}
                      onSelect={handleModelSelect}
                      onClose={() => setDropdownOpen(null)}
                      useLocalModel={useLocalModel}
                    />
                  </PromptPopover>
                )}
              </div>

              {/* Aspect ratio button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "ar" ? null : "ar"));
                  }}
                  className={promptControlClassName({
                    active: dropdownOpen === "ar",
                  })}
                >
                  <PromptAspectRatioIcon />
                  <span className={PROMPT_CONTROL_LABEL_CLASS}>
                    {selectedAr}
                  </span>
                </button>

                {dropdownOpen === "ar" && (
                  <PromptPopover
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SimpleDropdown
                      title="Aspect Ratio"
                      options={currentAspectRatios}
                      selected={selectedAr}
                      onSelect={(val) => setSelectedAr(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </PromptPopover>
                )}
              </div>

              {/* Quality/resolution button (represented as Diamond icon) */}
              {showQualityBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "quality" ? null : "quality"));
                    }}
                    className={promptControlClassName({
                      active: dropdownOpen === "quality",
                    })}
                  >
                    <PromptQualityIcon />
                    <span className={PROMPT_CONTROL_LABEL_CLASS}>
                      {selectedQuality || currentResolutions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "quality" && (
                    <PromptPopover
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SimpleDropdown
                        title="Resolution"
                        options={currentResolutions}
                        selected={selectedQuality}
                        onSelect={(val) => setSelectedQuality(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </PromptPopover>
                  )}
                </div>
              )}

              {/* Effect type button */}
              {showEffectBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "effect" ? null : "effect"));
                    }}
                    className={promptControlClassName({
                      active: dropdownOpen === "effect",
                    })}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className={`${PROMPT_CONTROL_LABEL_CLASS} max-w-[140px] truncate`}>
                      {selectedEffect || "Effect"}
                    </span>
                  </button>

                  {dropdownOpen === "effect" && (
                    <PromptPopover
                      onClick={(e) => e.stopPropagation()}
                      className="min-w-[200px]"
                    >
                      <SimpleDropdown
                        title="Effect Type"
                        options={currentEffects}
                        selected={selectedEffect}
                        onSelect={(val) => setSelectedEffect(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </PromptPopover>
                  )}
                </div>
              )}

              {/* Tools button */}
              <button
                type="button"
                className={promptControlClassName({ active: showToolsPanel })}
                onClick={() => {
                  setShowToolsPanel(!showToolsPanel);
                  if (!showToolsPanel && showAdvanced) setShowAdvanced(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
                <span className={PROMPT_CONTROL_LABEL_CLASS}>Tools</span>
              </button>

              {/* Advanced button */}
              <button
                type="button"
                className={promptControlClassName({ active: showAdvanced })}
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                  if (!showAdvanced && showToolsPanel) setShowToolsPanel(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60 text-secondary">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 001.82-.33 1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-1.82.33A1.65 1.65 0 0019.4 9a1.65 1.65 0 00-1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                <span className={PROMPT_CONTROL_LABEL_CLASS}>Advanced</span>
              </button>

              {/* Draw button */}
              <button
                type="button"
                className={promptControlClassName()}
                onClick={() => setIsDrawModalOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40 text-white group-hover:text-[#22d3ee] transition-colors">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span className={PROMPT_CONTROL_LABEL_CLASS}>
                  Draw
                </span>
              </button>
            </PromptControls>

            {/* Generate button */}
            <PromptAction
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>
                  {useLocalModel && localGenProgress > 0 ? `${localGenProgress}%` : 'Generating...'}
                </>
              ) : (
                <>
                  <span>Generate ✦</span>
                </>
              )}
            </PromptAction>
          </PromptFooter>
      </PromptComposer>

      {/* ── FULLSCREEN IMAGE MODAL ── */}
      {fullscreenUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenUrl(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img 
            src={fullscreenUrl} 
            alt="Fullscreen Preview" 
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── DRAW CANVAS MODAL ── */}
      <DrawModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        apiKey={apiKey}
        batchSize={1}
        onAddHistoryItem={addToHistory}
      />
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ duration: 5000, style: { background: '#18181b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '13px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)', maxWidth: '440px', wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: '12px 16px' } }} />
    </div>
  );
}
