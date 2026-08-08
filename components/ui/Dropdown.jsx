'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export function Dropdown({ trigger, children, align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 mt-2 w-56 rounded-xl border border-neutral-border-glass bg-neutral-card-bg shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-black ring-opacity-5 focus:outline-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          )}
        >
          <div className="py-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, {
                  onClick: (e) => {
                    if (child.props.onClick) child.props.onClick(e);
                    setIsOpen(false);
                  },
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, className, icon: Icon, danger }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'group flex w-full items-center px-4 py-2.5 text-sm transition-colors text-left',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-neutral-secondary hover:text-white hover:bg-white/10',
        className
      )}
    >
      {Icon && (
        <Icon
          className={clsx(
            'mr-3 h-4 w-4',
            danger ? 'text-red-400' : 'text-neutral-muted group-hover:text-white'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-neutral-border-glass" />;
}
