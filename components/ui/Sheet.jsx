import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Sheet({
  isOpen,
  onClose,
  children,
  side = 'right',
  className,
  title,
  description,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen && typeof document === 'undefined') return null;

  const sideClasses = {
    top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
    bottom:
      'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
    left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
    right:
      'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
  };

  const content = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        side === 'right'
          ? 'justify-end'
          : side === 'left'
            ? 'justify-start'
            : side === 'bottom'
              ? 'items-end'
              : 'items-start'
      )}
      {...(!isOpen ? { 'data-state': 'closed' } : { 'data-state': 'open' })}
    >
      <div
        className={cn(
          'fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={cn(
          'fixed z-50 gap-4 bg-app-bg p-6 shadow-2xl transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out',
          'border-white/10 backdrop-blur-xl bg-panel-bg/80',
          sideClasses[side],
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
          className
        )}
        style={{
          transform: !isOpen
            ? side === 'right'
              ? 'translateX(100%)'
              : side === 'left'
                ? 'translateX(-100%)'
                : side === 'bottom'
                  ? 'translateY(100%)'
                  : 'translateY(-100%)'
            : 'translate(0)',
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col space-y-2 text-center sm:text-left mb-6">
          {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
          {description && <p className="text-sm text-neutral-secondary">{description}</p>}
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        <div className="h-full overflow-y-auto overflow-x-hidden relative">{children}</div>
      </div>
    </div>
  );

  return isOpen ? createPortal(content, document.body) : null;
}
