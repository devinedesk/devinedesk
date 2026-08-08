import React from 'react';

export function EmptyStateHero({
  selectedModelName,
  title = 'START CREATING WITH',
  subtitle = 'Describe a scene, character, mood, or style — and watch it come to life',
  heroImages = [
    'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif',
    'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif',
    'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif',
    'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif',
  ],
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
      {/* Overlapping floating cards */}
      {heroImages && heroImages.length >= 4 && (
        <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100">
          <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0">
            <img
              src={heroImages[0]}
              alt="Creative asset 1"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
            <img
              src={heroImages[1]}
              alt="Creative asset 2"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
            <img
              src={heroImages[2]}
              alt="Creative asset 3"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
            <img
              src={heroImages[3]}
              alt="Creative asset 4"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center">
        <span className="text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90">
          {title}
        </span>
        <span className="text-primary font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight">
          {selectedModelName}
        </span>
      </h1>
      <p className="text-white/60 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
        {subtitle}
      </p>
    </div>
  );
}
