import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingOverlay({ 
  message = "Generating your masterpiece...", 
  subMessage = "This may take a few moments depending on the model." 
}) {
  return (
    <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl border border-white/5 shadow-2xl">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
      <h3 className="text-xl font-bold text-white mb-2">{message}</h3>
      <p className="text-sm text-white/60 text-center max-w-sm px-4">
        {subMessage}
      </p>
    </div>
  );
}
