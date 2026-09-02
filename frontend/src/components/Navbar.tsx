import React from 'react';
import { GitCompare, RefreshCw, Menu, ShieldAlert } from 'lucide-react';
import { NavTab } from './Sidebar';
import { Project } from '../types';
import { ProjectSelector } from './ProjectSelector';

interface NavbarProps {
  activeTab: NavTab;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  onProjectCreated: (project: Project) => void;
  onRefresh: () => void;
  onOpenCompare: () => void;
  onOpenMobileNav?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  projects,
  activeProject,
  onSelectProject,
  onProjectCreated,
  onRefresh,
  onOpenCompare,
  onOpenMobileNav,
}) => {
  const titleMap: Record<NavTab, string> = {
    dashboard: 'SQA Metrics & Vulnerability Overview',
    import: 'Import Static Analysis Report',
    findings: 'Static Code Analysis Findings Explorer',
    'code-smells': 'Code Smell Categorization & Hotspots',
    security: 'Security Vulnerabilities & Resolution Lifecycle',
    history: 'Analysis Run History',
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3">
      {/* Top Mobile Bar (< lg) */}
      <div className="flex lg:hidden items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label="Open Mobile Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0">
              <ShieldAlert size={16} />
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-tight">CodeLens</span>
          </div>
        </div>

        <div className="shrink-0">
          <ProjectSelector
            projects={projects}
            activeProject={activeProject}
            onSelectProject={onSelectProject}
            onProjectCreated={onProjectCreated}
          />
        </div>
      </div>

      {/* Main Bar (Desktop & Mobile Sub-Row) */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">{titleMap[activeTab]}</h2>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {activeProject
                ? `Project: ${activeProject.name} (${activeProject.primary_language})`
                : 'No Project Selected — Select or create a project to continue.'}
            </p>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden lg:block shrink-0" />

          {/* Desktop Project Selector */}
          <div className="hidden lg:block shrink-0">
            <ProjectSelector
              projects={projects}
              activeProject={activeProject}
              onSelectProject={onSelectProject}
              onProjectCreated={onProjectCreated}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium transition-all min-h-[44px] min-w-[44px] justify-center"
            aria-label="Compare Scans"
          >
            <GitCompare size={15} />
            <span className="hidden sm:inline">Compare Scans</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
