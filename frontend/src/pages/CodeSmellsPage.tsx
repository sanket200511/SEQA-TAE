import React, { useEffect, useState } from 'react';
import { Sparkles, Flame, FolderX, FolderPlus } from 'lucide-react';
import { CodeSmellsResponse, Project } from '../types';
import { fetchCodeSmellsSummary, fetchAnalysisHistory } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';

interface CodeSmellsPageProps {
  activeProject: Project | null;
}

export const CodeSmellsPage: React.FC<CodeSmellsPageProps> = ({ activeProject }) => {
  const [data, setData] = useState<CodeSmellsResponse | null>(null);
  const [hasAnalysisRuns, setHasAnalysisRuns] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProject) {
      setData(null);
      setHasAnalysisRuns(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAnalysisHistory(activeProject.id).then((history) => {
      setHasAnalysisRuns(history.length > 0);
      return fetchCodeSmellsSummary(activeProject.id);
    })
      .then((res) => {
        setData(res);
        if (res.smell_categories.length > 0) {
          setSelectedCategory(res.smell_categories[0].category);
        } else {
          setSelectedCategory(null);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading code smell breakdown...</div>;
  }

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

  // State 2: Project selected, but has 0 analysis runs
  if (!hasAnalysisRuns) {
    return (
      <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-3">
        <FolderPlus size={32} className="text-slate-500 mx-auto" />
        <h3 className="text-sm sm:text-base font-semibold text-slate-200">
          Project "{activeProject.name}" has no analysis runs yet
        </h3>
        <p className="text-xs text-slate-400">Import a static analysis report to begin.</p>
      </div>
    );
  }

  // State 3: Project has analysis runs, but 0 code smells detected
  if (!data || data.smell_categories.length === 0) {
    return (
      <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-3">
        <Sparkles size={32} className="text-purple-400 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">No Code Smells Detected</h3>
        <p className="text-xs text-slate-400">
          No code smells were detected in project "{activeProject.name}".
        </p>
      </div>
    );
  }

  const activeCategoryItem = data.smell_categories.find((c) => c.category === selectedCategory);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-xl bg-purple-950/20 border border-purple-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-purple-200 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400 shrink-0" />
            <span className="truncate">Code Smell Categorization & Maintainability Analysis</span>
          </h3>
          <p className="text-xs text-purple-300/80 mt-1">
            Normalized static analysis findings categorized by software design anti-patterns in '{activeProject.name}'.
          </p>
        </div>
        <div className="px-4 py-2.5 rounded-lg bg-slate-900 border border-purple-800/40 text-center w-full sm:w-auto shrink-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Code Smells</div>
          <div className="text-xl sm:text-2xl font-bold text-purple-300">{data.total_code_smells}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Smell Subcategories</h4>
          <div className="space-y-2">
            {data.smell_categories.map((cat) => {
              const isSelected = selectedCategory === cat.category;
              return (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between min-h-[44px] ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200 font-semibold shadow-lg shadow-purple-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="text-xs font-medium truncate">{cat.category}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {cat.affected_files_count} affected files
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-purple-900/50 border border-purple-700/50 text-xs font-bold text-purple-300 shrink-0">
                    {cat.count}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hotspots Section */}
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame size={14} className="shrink-0" />
              <span>Maintainability Hotspot Files</span>
            </h4>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2 text-xs">
              {data.hotspot_files.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800/80 gap-2">
                  <span className="font-mono text-slate-300 break-all text-[11px] truncate">{h.file}</span>
                  <span className="text-amber-400 font-bold text-xs shrink-0">{h.count} smells</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Detail Findings Table / Mobile Cards */}
        <div className="lg:col-span-8 space-y-4">
          {activeCategoryItem && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                  Findings under <span className="text-purple-400">{activeCategoryItem.category}</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">{activeCategoryItem.count} instances detected</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                {/* Mobile Cards (< lg) */}
                <div className="block lg:hidden divide-y divide-slate-800/60">
                  {activeCategoryItem.findings.map((f: any) => (
                    <div key={f.id} className="p-4 space-y-2 hover:bg-slate-800/40">
                      <div className="flex items-center justify-between gap-2">
                        <SeverityBadge severity={f.severity} size="sm" />
                        <span className="font-mono text-indigo-400 font-medium text-xs">{f.rule_id}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 break-all">{f.title}</div>
                      <p className="text-[11px] text-slate-400 leading-relaxed break-words">{f.description}</p>
                      <div className="font-mono text-[11px] text-slate-500 break-all pt-1">
                        {f.file_path}:{f.line_number || 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table (≥ lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Severity</th>
                        <th className="p-3.5">Rule ID</th>
                        <th className="p-3.5">Message / Refactoring Guidance</th>
                        <th className="p-3.5">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {activeCategoryItem.findings.map((f: any) => (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5"><SeverityBadge severity={f.severity} size="sm" /></td>
                          <td className="p-3.5 font-mono text-indigo-400 font-medium">{f.rule_id}</td>
                          <td className="p-3.5 space-y-1">
                            <div className="text-slate-200 font-medium">{f.title}</div>
                            <div className="text-slate-400 text-[11px]">{f.description}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                            {f.file_path}:{f.line_number || 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
