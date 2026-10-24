'use client';

import React from 'react';
import { Card } from './card';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  trend,
  className = '',
}) => {
  return (
    <Card className={`relative overflow-hidden ${className}`} padding="sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-[#D6F0EF]/60 text-[#087F8C] flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#242039] tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-[#22A06B]">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#667085]">
          {subtitle}
        </p>
      )}
    </Card>
  );
};
