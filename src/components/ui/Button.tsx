'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, loading, children, className = '', disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-primary text-on-primary rounded-full hover:opacity-90 shadow-sm',
      secondary: 'border-2 border-secondary text-secondary rounded-full hover:bg-secondary-container',
      text: 'text-secondary hover:underline',
      icon: 'text-on-surface-variant p-2 hover:bg-surface-container rounded-full',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-label-sm',
      md: 'px-6 py-3 text-label-md',
      lg: 'px-10 py-4 text-body-md',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={`${baseClasses} ${variantClasses[variant]} ${variant !== 'icon' && variant !== 'text' ? sizeClasses[size] : ''} ${className}`}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
