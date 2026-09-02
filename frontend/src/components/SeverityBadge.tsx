import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Severity } from '../types';

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sevLower = severity.toLowerCase();

  let bgClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  let Icon = Info;

  if (sevLower.includes('crit')) {
    bgClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    Icon = ShieldAlert;
  } else if (sevLower.includes('high') || sevLower.includes('error')) {
    bgClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    Icon = AlertOctagon;
  } else if (sevLower.includes('med') || sevLower.includes('warn')) {
    bgClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    Icon = AlertTriangle;
  } else if (sevLower.includes('low') || sevLower.includes('minor')) {
    bgClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    Icon = AlertCircle;
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
    <span className={`inline-flex items-center rounded-md border ${bgClass} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} className="shrink-0" />
      <span>{severity}</span>
    </span>
  );
};
