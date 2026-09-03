import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Folder, Plus, Check, X, FolderX } from 'lucide-react';
import { Project } from '../types';
import { createProject } from '../services/api';

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  onProjectCreated: (project: Project) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onProjectCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('Python');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const newProj = await createProject(name, description, language);
      onProjectCreated(newProj);
      onSelectProject(newProj);
      setShowCreateModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm max-w-[200px] sm:max-w-[280px] min-h-[40px]"
            aria-label="Select Project"
          >
            <Folder size={14} className={activeProject ? 'text-indigo-400 shrink-0' : 'text-slate-500 shrink-0'} />
            <span className="truncate">{activeProject ? activeProject.name : 'No Project Selected'}</span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline shrink-0">
              {activeProject ? `(${activeProject.primary_language})` : '(Select)'}
            </span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Create New Project"
            aria-label="Create New Project"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 max-w-[90vw] rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1 divide-y divide-slate-800 animate-in fade-in duration-150">
            <div className="max-h-60 overflow-y-auto">
              {/* Option to clear active project */}
              <button
                onClick={() => {
                  onSelectProject(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 text-xs flex items-center justify-between transition-colors min-h-[44px] ${
                  !activeProject ? 'bg-indigo-600/15 text-indigo-300 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderX size={15} className="text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate">No Project Selected</div>
                    <div className="text-[10px] text-slate-500 font-mono">Clear active project filter</div>
                  </div>
                </div>
                {!activeProject && <Check size={14} className="text-indigo-400 shrink-0 ml-2" />}
              </button>

              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-3 text-xs flex items-center justify-between transition-colors min-h-[44px] ${
                    activeProject?.id === p.id ? 'bg-indigo-600/15 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.primary_language}</div>
                  </div>
                  {activeProject?.id === p.id && <Check size={14} className="text-indigo-400 shrink-0" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full text-left px-3.5 py-3 text-xs font-medium text-indigo-400 hover:bg-slate-800 flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus size={14} />
              <span>Create New Project Scope</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal attached directly to document.body via Portal */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md max-h-[90vh] rounded-xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Folder size={18} className="text-indigo-400 shrink-0" />
                <h3 className="font-semibold text-slate-100 text-sm truncate">Create Real Project Scope</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Healthcare API / Auth Service"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Tech / Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[40px]"
                >
                  <option value="Python">Python</option>
                  <option value="TypeScript / JavaScript">TypeScript / JavaScript</option>
                  <option value="Multi-Language">Multi-Language Project</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Backend REST microservice evaluated for SQA code smells and security flaws"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
