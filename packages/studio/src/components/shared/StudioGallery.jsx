import React from "react";
import MobileGenerationActions, { GenerationCopyButtons } from "../MobileGenerationActions.jsx";

export function StudioGallery({
  history,
  onSelectFullscreen,
  onDownload,
  onDelete,
  onCopyError,
  studioName = "Studio",
  customActions,
  customMobileActions,
}) {
  if (!history || history.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pt-4 animate-fade-in-up">
      {history.map((entry, idx) => (
        <div
          key={entry.id || idx}
          className="relative group rounded-lg overflow-hidden border border-white/10 bg-panel-bg shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer"
          onClick={() => onSelectFullscreen && onSelectFullscreen(entry.url)}
        >
          {entry.url?.endsWith(".mp4") ? (
            <video
              src={entry.url}
              className="w-full aspect-square object-cover bg-black/40 hover:opacity-80 transition-opacity"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : entry.url?.endsWith(".wav") || entry.url?.endsWith(".mp3") ? (
            <div className="w-full aspect-square bg-black/40 flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/50">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            </div>
          ) : (
            <img
              src={entry.url}
              alt={entry.prompt?.substring(0, 30) || "Generated media"}
              className="w-full aspect-square object-cover bg-black/40 hover:opacity-80 transition-opacity"
            />
          )}

          {/* Overlay actions */}
          <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GenerationCopyButtons
              prompt={entry.prompt || entry.settings?.prompt}
              imageUrl={entry.url}
              onCopyError={onCopyError}
            />
            {onDownload && (
              <button
                type="button"
                title="Download"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(entry, idx);
                }}
                className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </button>
            )}
            {customActions && customActions(entry, idx)}
            {onDelete && (
              <button
                type="button"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this generated item?")) {
                    onDelete(entry, idx);
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
            )}
          </div>
          
          <MobileGenerationActions
            prompt={entry.prompt || entry.settings?.prompt}
            imageUrl={entry.url}
            onCopyError={onCopyError}
            actions={[
              ...(onDownload ? [{
                kind: "download",
                label: "Download",
                onSelect: () => onDownload(entry, idx),
              }] : []),
              ...(customMobileActions ? customMobileActions(entry, idx) : []),
              ...(onDelete ? [{
                kind: "delete",
                label: "Delete",
                danger: true,
                onSelect: () => {
                  if (confirm("Are you sure you want to delete this generated item?")) {
                    onDelete(entry, idx);
                  }
                },
              }] : []),
            ]}
          />

          {/* Prompt & Details */}
          <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
            <p className="text-white/70 text-xs line-clamp-3 leading-relaxed" title={entry.prompt || entry.settings?.prompt}>
              {entry.prompt || entry.settings?.prompt || "No prompt provided"}
            </p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 capitalize">
                  {entry.model?.replace(/-/g, " ") || studioName}
                </span>
                {entry.aspect_ratio && (
                  <span className="text-[10px] text-white/60">{entry.aspect_ratio}</span>
                )}
                {entry.resolution && (
                  <span className="text-[10px] text-white/60">{entry.resolution}</span>
                )}
                {entry.duration && (
                  <span className="text-[10px] text-white/60">{entry.duration}s</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
