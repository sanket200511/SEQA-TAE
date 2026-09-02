import React, { useEffect, useState } from 'react';
import { History, GitCompare, FileCheck, Calendar, HardDrive, FolderX, FolderPlus } from 'lucide-react';
import { AnalysisRun, Project } from '../types';
import { fetchAnalysisHistory } from '../services/api';

interface AnalysisHistoryPageProps {
  activeProject: Project | null;
  onOpenCompare: () => void;
}

export const AnalysisHistoryPage: React.FC<AnalysisHistoryPageProps> = ({ activeProject, onOpenCompare }) => {
  const [history, setHistory] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProject) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAnalysisHistory(activeProject.id)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  // State 1: No Project Selected
  if (!activeProject) {
    return (
      <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-3">
        <FolderX size={32} className="text-slate-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">No Project Selected</h3>
        <p className="text-xs text-slate-400">Select or create a project to continue.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 w-full min-w-0">
      <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
            <History size={18} className="text-indigo-400 shrink-0" />
            <span className="truncate">Analysis Import Run History</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Audit history of imported static code analysis reports for '{activeProject.name}'.
          </p>
        </div>

        <button
          onClick={onOpenCompare}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/20 shrink-0 min-h-[44px]"
        >
          <GitCompare size={16} />
          <span>Launch Scan Regression Comparison</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading analysis import history...</div>
        ) : history.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <FolderPlus size={32} className="text-slate-500 mx-auto" />
            <h4 className="text-sm sm:text-base font-semibold text-slate-200">
              Project "{activeProject.name}" has no analysis runs yet
            </h4>
            <p className="text-xs text-slate-400">Import a static analysis report to begin.</p>
          </div>
        ) : (
          <>
            {/* Mobile View (< sm) */}
            <div className="block sm:hidden divide-y divide-slate-800/60">
              {history.map((run) => (
                <div key={run.id} className="p-4 space-y-2 hover:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-xs">#{run.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                      <FileCheck size={10} />
                      <span>{run.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium text-[11px]">
                      {run.tool}
                    </span>
                    <span className="font-mono text-slate-300 text-xs truncate break-all">{run.filename}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" />
                      <span>{new Date(run.imported_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-bold text-slate-200">{run.total_findings} findings</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (≥ sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-4">Run ID</th>
                    <th className="p-4">Analysis Tool</th>
                    <th className="p-4">Log Filename</th>
                    <th className="p-4">Imported Date & Time</th>
                    <th className="p-4">Findings Count</th>
                    <th className="p-4">Files Analyzed</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-mono font-bold text-indigo-400">#{run.id}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 font-medium">
                          {run.tool}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300 flex items-center gap-1.5 truncate max-w-xs">
                        <HardDrive size={14} className="text-slate-500 shrink-0" />
                        <span className="truncate">{run.filename}</span>
                      </td>
                      <td className="p-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          <span>{new Date(run.imported_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-200">{run.total_findings} findings</td>
                      <td className="p-4 font-mono text-slate-400">{run.files_analyzed || 1} files</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 w-fit">
                          <FileCheck size={12} />
                          <span>{run.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
