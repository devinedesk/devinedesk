'use client';

import React from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export function MediaViewer({ isOpen, onClose, mediaUrl, mediaType = 'image', title = 'Media Viewer' }) {
  const [scale, setScale] = React.useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = title || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-5xl">
      <div className="flex flex-col items-center justify-center p-4 min-h-[60vh] relative overflow-hidden bg-black/50 rounded-md">
        
        <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-black/60 p-1 rounded-md backdrop-blur-sm border border-white/10">
          <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4 text-white" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4 text-white" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
            <Download className="w-4 h-4 text-white" />
          </Button>
        </div>

        <div className="overflow-auto w-full h-full flex items-center justify-center" style={{ maxHeight: '70vh' }}>
          {mediaType === 'image' ? (
            <img 
              src={mediaUrl} 
              alt={title} 
              style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-in-out' }}
              className="max-w-full max-h-full object-contain"
            />
          ) : mediaType === 'video' ? (
            <video 
              src={mediaUrl} 
              controls
              style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-in-out' }}
              className="max-w-full max-h-full"
            />
          ) : (
            <div className="text-gray-400">Unsupported media type</div>
          )}
        </div>
      </div>
    </Modal>
  );
}
