import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, GitCompare, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, FolderX } from 'lucide-react';
import { AnalysisRun, ScanCompareResult, Project } from '../types';
import { fetchAnalysisHistory, compareScans } from '../services/api';
import { SeverityBadge } from './SeverityBadge';
import { CategoryBadge } from './CategoryBadge';

interface ScanCompareModalProps {
  activeProject: Project | null;
  onClose: () => void;
}

export const ScanCompareModal: React.FC<ScanCompareModalProps> = ({ activeProject, onClose }) => {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [runA, setRunA] = useState<number | null>(null);
  const [runB, setRunB] = useState<number | null>(null);
  const [result, setResult] = useState<ScanCompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeProject) {
      fetchAnalysisHistory(activeProject.id).then((history) => {
        setRuns(history);
        if (history.length >= 2) {
          setRunA(history[1].id);
          setRunB(history[0].id);
        } else {
          setRunA(null);
          setRunB(null);
          setResult(null);
        }
      });
    } else {
      setRuns([]);
      setRunA(null);
      setRunB(null);
      setResult(null);
    }
  }, [activeProject?.id]);

  const handleCompare = async () => {
    if (!runA || !runB) return;
    setLoading(true);
    try {
      const res = await compareScans(runA, runB);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runA && runB) {
      handleCompare();
    }
  }, [runA, runB]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare size={20} className="text-indigo-400 shrink-0" />
            <h3 className="font-semibold text-slate-100 text-sm truncate">
              Scan Regression Comparison {activeProject ? `— ${activeProject.name}` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close scan comparison modal"
          >
            <X size={18} />
          </button>
        </div>

        {!activeProject ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <FolderX size={32} className="text-slate-500 mx-auto" />
            <h4 className="text-sm sm:text-base font-semibold text-slate-200">No Project Selected</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select or create a project to compare static analysis runs.
            </p>
          </div>
        ) : runs.length < 2 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <GitCompare size={32} className="text-slate-500 mx-auto" />
            <h4 className="text-sm sm:text-base font-semibold text-slate-200">At least 2 Analysis Runs Required</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Project "{activeProject.name}" has {runs.length} scan run(s). Import another scan report to perform regression comparison.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Previous Scan (Base)</label>
                  <select
                    value={runA || ''}
                    onChange={(e) => setRunA(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  >
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} — {r.tool} ({r.filename})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight size={16} className="text-slate-600 rotate-90 sm:rotate-0" />
                </div>

                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Current Scan (Target)</label>
                  <select
                    value={runB || ''}
                    onChange={(e) => setRunB(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  >
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.id} — {r.tool} ({r.filename})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Comparing scan results...</div>
              ) : result ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1">
                      <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
                        <span>New Findings (Regressions)</span>
                        <ShieldAlert size={16} />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-rose-200">{result.summary.new_count}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                        <span>Resolved Findings (Fixed)</span>
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-200">{result.summary.resolved_count}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Persistent Findings</span>
                        <Sparkles size={16} />
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-slate-200">{result.summary.persistent_count}</div>
                    </div>
                  </div>

                  {/* Lists */}
                  {result.new_findings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-semibold text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert size={16} className="shrink-0" />
                        <span>New Regressions Introduced in Scan #{result.run_b.id}</span>
                      </h4>
                      <div className="space-y-2">
                        {result.new_findings.map((f) => (
                          <div key={f.id} className="p-3 rounded-lg bg-slate-950 border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <SeverityBadge severity={f.severity} size="sm" />
                                <span className="font-semibold text-slate-200 break-all">{f.title}</span>
                              </div>
                              <div className="font-mono text-slate-500 text-[11px] break-all">{f.file_path} {f.line_number && `: L${f.line_number}`}</div>
                            </div>
                            <div className="shrink-0">
                              <CategoryBadge category={f.category} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.resolved_findings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>Resolved Issues (Disappeared since Scan #{result.run_a.id})</span>
                      </h4>
                      <div className="space-y-2">
                        {result.resolved_findings.map((f) => (
                          <div key={f.id} className="p-3 rounded-lg bg-slate-950 border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <SeverityBadge severity={f.severity} size="sm" />
                                <span className="font-semibold text-slate-200 line-through opacity-80 break-all">{f.title}</span>
                              </div>
                              <div className="font-mono text-slate-500 text-[11px] break-all">{f.file_path} {f.line_number && `: L${f.line_number}`}</div>
                            </div>
                            <div className="shrink-0">
                              <CategoryBadge category={f.category} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">Select two scans above to compute regression analysis.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
