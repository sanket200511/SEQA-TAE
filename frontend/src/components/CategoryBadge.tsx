import React from 'react';
import { Shield, Sparkles, Bug, Zap, Wrench, HelpCircle } from 'lucide-react';
import { Category } from '../types';

interface CategoryBadgeProps {
  category: Category | string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  let bgClass = 'bg-slate-800 text-slate-300 border-slate-700';
  let Icon = HelpCircle;

  if (category === 'Security Vulnerability') {
    bgClass = 'bg-red-950/60 text-red-300 border-red-800/40';
    Icon = Shield;
  } else if (category === 'Code Smell') {
    bgClass = 'bg-purple-950/60 text-purple-300 border-purple-800/40';
    Icon = Sparkles;
  } else if (category === 'Bug') {
    bgClass = 'bg-orange-950/60 text-orange-300 border-orange-800/40';
    Icon = Bug;
  } else if (category === 'Performance') {
    bgClass = 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40';
    Icon = Zap;
  } else if (category === 'Maintainability') {
    bgClass = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40';
    Icon = Wrench;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${bgClass}`}>
      <Icon size={13} />
      <span>{category}</span>
    </span>
  );
};
