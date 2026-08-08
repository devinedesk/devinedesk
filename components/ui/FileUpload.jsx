'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function FileUpload({
  onUpload,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  multiple = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFiles = async (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) => file.size <= maxSize);

    if (validFiles.length === 0) return;

    if (multiple) {
      setFiles((prev) => [...prev, ...validFiles]);
    } else {
      setFiles([validFiles[0]]);
    }

    if (onUpload) {
      setIsUploading(true);
      try {
        await onUpload(multiple ? validFiles : validFiles[0]);
      } catch (err) {
        console.error('Upload failed', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-colors bg-black/20',
          isDragging
            ? 'border-cyan-500 bg-cyan-500/5'
            : 'border-neutral-border-glass hover:border-neutral-muted hover:bg-black/40'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-3" />
          ) : (
            <UploadCloud className="h-10 w-10 text-neutral-secondary mb-3" />
          )}
          <p className="mb-2 text-sm text-neutral-secondary">
            <span className="font-semibold text-white">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-neutral-muted">
            {accept ? accept : 'Any file'} (Max {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept={accept}
          multiple={multiple}
          disabled={isUploading}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-border-glass bg-black/40"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <File className="h-5 w-5 text-neutral-secondary shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-white truncate">{file.name}</span>
                  <span className="text-xs text-neutral-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded-md text-neutral-secondary hover:text-red-400 hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
