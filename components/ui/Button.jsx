import React from 'react';
import { cn } from '@/src/lib/utils';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  fullWidth = false,
  className = '', 
  disabled, 
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app-bg';
  
  const variants = {
    primary: 'bg-primary text-black hover:bg-primary-hover shadow-glow',
    secondary: 'bg-card-bg text-white hover:bg-panel-bg border border-muted',
    outline: 'border border-primary text-primary hover:bg-primary/10',
    ghost: 'text-secondary hover:text-white hover:bg-panel-bg',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
    icon: 'p-2'
  };

  const isDisabled = disabled || isLoading;
  const stateStyles = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={cn(baseStyles, variantStyles, sizeStyles, stateStyles, widthStyles, className)}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
