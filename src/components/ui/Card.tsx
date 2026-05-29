'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'filled' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', children, className = '', ...props }, ref) => {
    const baseClasses = 'rounded-lg transition-all duration-200';

    const variantClasses = {
      default: 'bg-surface-container-lowest border border-outline-variant',
      elevated: 'bg-surface-container-lowest border border-outline-variant soft-elevation',
      filled: 'bg-surface-container',
      outlined: 'border-2 border-outline-variant bg-transparent',
    };

    const paddingClasses = {
      sm: 'p-4',
      md: 'p-stack-md',
      lg: 'p-stack-lg',
    };

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
