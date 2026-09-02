import React, { useEffect } from 'react';
import { LayoutDashboard, FileUp, ListTree, Sparkles, ShieldAlert, History, X } from 'lucide-react';

export type NavTab = 'dashboard' | 'import' | 'findings' | 'code-smells' | 'security' | 'history';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import', label: 'Import Analysis', icon: FileUp },
    { id: 'findings', label: 'Findings Explorer', icon: ListTree },
    { id: 'code-smells', label: 'Code Smells', icon: Sparkles },
    { id: 'security', label: 'Security Vulnerabilities', icon: ShieldAlert },
    { id: 'history', label: 'Analysis History', icon: History },
  ];

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [mobileOpen]);

  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 min-h-full">
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-tight text-base leading-tight">CodeLens</h1>
            <span className="text-[10px] text-indigo-400 font-mono font-medium tracking-wide uppercase">
              SQA Log Visualizer
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Close Mobile Navigation Menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-medium transition-all min-h-[44px] ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="font-medium text-slate-400">SEQA / TAE Academic Project</div>
        <div>Static Code Analysis Log Normalizer & Defect Tracker</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Persistent Desktop Sidebar (≥ 1024px) */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer (Screen < 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative z-10 w-64 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
