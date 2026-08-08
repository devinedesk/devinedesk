'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function UploadAssetButton() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      toast.success('Asset uploaded successfully');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, audio/mpeg, audio/wav"
      />
      <button
        onClick={handleUploadClick}
        disabled={isUploading}
        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {isUploading ? 'Uploading...' : 'Upload Asset'}
      </button>
    </>
  );
}
