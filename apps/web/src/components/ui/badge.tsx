'use client';

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'success' | 'warm' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    teal: 'bg-[#D6F0EF] text-[#087F8C] font-semibold',
    success: 'bg-[#E5F7EE] text-[#22A06B] font-semibold',
    warm: 'bg-[#FEF3E6] text-[#D97706] font-semibold',
    neutral: 'bg-[#F2F4F5] text-[#667085] font-medium',
    outline: 'bg-transparent border border-[#E6E9E8] text-[#242039] font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
