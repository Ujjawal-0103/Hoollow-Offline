'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'soft' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-180 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:ring-offset-2';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-[10px] gap-1.5 h-8',
      md: 'px-4 py-2 text-sm rounded-[12px] gap-2 h-10',
      lg: 'px-6 py-3 text-base rounded-[12px] gap-2.5 h-12',
    };

    const variantStyles = {
      primary:
        'bg-[#087F8C] text-white hover:bg-[#066772] hover:-translate-y-0.5 active:scale-[0.98] shadow-sm',
      secondary:
        'bg-white text-[#242039] border border-[#E6E9E8] hover:bg-[#FAF9F5] hover:border-[#c2eae8] hover:-translate-y-0.5 active:scale-[0.98]',
      tertiary:
        'bg-transparent text-[#087F8C] hover:bg-[#D6F0EF]/40 active:scale-[0.98]',
      soft:
        'bg-[#D6F0EF] text-[#087F8C] font-semibold hover:bg-[#c2eae8] hover:-translate-y-0.5 active:scale-[0.98]',
      danger:
        'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
