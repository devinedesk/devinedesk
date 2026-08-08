import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export function Carousel({ items = [], renderItem, className }) {
  const [current, setCurrent] = useState(0);

  if (!items || items.length === 0) return null;

  const next = () => setCurrent((c) => (c + 1) % items.length);
  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);

  return (
    <div
      className={clsx(
        'relative group overflow-hidden rounded-xl bg-black/40 border border-neutral-border-glass',
        className
      )}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0">
            {renderItem ? (
              renderItem(item, idx)
            ) : (
              <img src={item.url || item} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={clsx(
                  'w-2 h-2 rounded-full transition-colors',
                  current === idx ? 'bg-white' : 'bg-white/30 hover:bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
