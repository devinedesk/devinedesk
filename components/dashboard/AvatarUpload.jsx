'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export function AvatarUpload({ currentImage, onImageUpdate }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds 5MB limit');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to assets
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();

      // 2. Update user profile
      const profileResponse = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url }),
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to update profile picture');
      }

      toast.success('Profile picture updated');
      onImageUpdate(url);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group inline-block">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div
        onClick={handleUploadClick}
        className={`w-24 h-24 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center cursor-pointer relative transition-all ${isUploading ? 'opacity-50' : 'group-hover:border-cyan-500'}`}
      >
        {currentImage ? (
          <Image src={currentImage} alt="Avatar" fill className="object-cover" />
        ) : (
          <User size={32} className="text-neutral-500" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="animate-spin text-white w-6 h-6" />
          ) : (
            <Camera className="text-white w-6 h-6" />
          )}
        </div>
      </div>
    </div>
  );
}
