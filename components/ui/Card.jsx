import React from 'react';

export function Card({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  ...props 
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const baseStyles = 'bg-card-bg border border-muted rounded-2xl overflow-hidden';
  const hoverStyles = hover ? 'transition-all hover:border-secondary hover:shadow-lg' : '';
  const paddingStyles = paddings[padding] || paddings.md;

  return (
    <div className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-xl font-semibold leading-none tracking-tight text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-secondary ${className}`} {...props}>
      {children}
    </p>
  );
}
