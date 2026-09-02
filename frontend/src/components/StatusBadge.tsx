import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { VulnerabilityStatus } from '../types';

interface StatusBadgeProps {
  status: VulnerabilityStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusUpper = (status || 'OPEN').toUpperCase();

  let bgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  let Icon = AlertCircle;

  if (statusUpper === 'RESOLVED') {
    bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    Icon = CheckCircle2;
  } else if (statusUpper === 'IN PROGRESS') {
    bgClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    Icon = Clock;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${bgClass} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className="shrink-0" />
      <span>{statusUpper}</span>
    </span>
  );
};
