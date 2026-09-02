import React, { useEffect, useState } from 'react';
import { Search, ChevronRight, X, FolderX, FolderPlus } from 'lucide-react';
import { Finding, Project } from '../types';
import { fetchFindings } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CodeHighlighter } from '../components/CodeHighlighter';
import { VulnerabilityTimeline } from '../components/VulnerabilityTimeline';

interface FindingsPageProps {
  activeProject: Project | null;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({ activeProject }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [totalProjectFindings, setTotalProjectFindings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const loadFindings = () => {
    if (!activeProject) {
      setFindings([]);
      setTotalProjectFindings(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchFindings({ projectId: activeProject.id, limit: 1 })
      .then((unfiltered) => {
        return fetchFindings({
          projectId: activeProject.id,
          category: categoryFilter || undefined,
          severity: severityFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
          limit: 200,
        }).then((filtered) => {
          setTotalProjectFindings(unfiltered.length);
          setFindings(filtered);
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFindings();
  }, [activeProject?.id, categoryFilter, severityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFindings();
  };

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search findings in "${activeProject.name}"...`}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 min-h-[44px]"
          />
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          >
            <option value="">All Categories</option>
            <option value="Security Vulnerability">Security Vulnerability</option>
            <option value="Code Smell">Code Smell</option>
            <option value="Bug">Bug</option>
            <option value="Performance">Performance</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Table / Mobile List + Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={selectedFinding ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading findings for "{activeProject.name}"...</div>
            ) : totalProjectFindings === 0 ? (
              <div className="p-8 sm:p-12 text-center space-y-3">
                <FolderPlus size={32} className="text-slate-500 mx-auto" />
                <h4 className="text-sm sm:text-base font-semibold text-slate-200">
                  Project "{activeProject.name}" has no analysis runs yet
                </h4>
                <p className="text-xs text-slate-400">Import a static analysis report to begin.</p>
              </div>
            ) : findings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No findings match the selected filters for "{activeProject.name}".
              </div>
            ) : (
              <>
                {/* Mobile Cards (< lg) */}
                <div className="block lg:hidden divide-y divide-slate-800/60">
                  {findings.map((f) => {
                    const isSelected = selectedFinding?.id === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedFinding(f)}
                        className={`p-4 space-y-2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={f.severity} size="sm" />
                            <CategoryBadge category={f.category} />
                          </div>
                          {f.vulnerability && <StatusBadge status={f.vulnerability.status} size="sm" />}
                        </div>

                        <div className="font-semibold text-slate-200 text-xs break-all">{f.title}</div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
                          <span className="text-indigo-400 font-medium">{f.rule_id}</span>
                          <span className="truncate">{f.file_path}:{f.line_number || 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table (≥ lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Severity</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">Rule</th>
                        <th className="p-3.5">Title</th>
                        <th className="p-3.5">File & Line</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {findings.map((f) => {
                        const isSelected = selectedFinding?.id === f.id;
                        return (
                          <tr
                            key={f.id}
                            onClick={() => setSelectedFinding(f)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3.5"><SeverityBadge severity={f.severity} size="sm" /></td>
                            <td className="p-3.5"><CategoryBadge category={f.category} /></td>
                            <td className="p-3.5 font-mono text-indigo-400 font-medium">{f.rule_id}</td>
                            <td className="p-3.5 text-slate-200 font-medium max-w-xs truncate">{f.title}</td>
                            <td className="p-3.5 font-mono text-slate-400 max-w-xs truncate">
                              {f.file_path}:{f.line_number || 1}
                            </td>
                            <td className="p-3.5">
                              {f.vulnerability ? (
                                <StatusBadge status={f.vulnerability.status} size="sm" />
                              ) : (
                                <span className="text-slate-500 font-mono">—</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right text-slate-500">
                              <ChevronRight size={16} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Finding Detail Drawer (Mobile Modal + Desktop Sticky Panel) */}
        {selectedFinding && (
          <div className="fixed inset-0 z-50 p-3 sm:p-4 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:block lg:col-span-5">
            <div className="w-full max-w-lg lg:max-w-none max-h-[90vh] lg:max-h-none overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-6 shadow-2xl lg:shadow-none sticky lg:top-20">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SeverityBadge severity={selectedFinding.severity} size="sm" />
                    <CategoryBadge category={selectedFinding.category} />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 break-all">{selectedFinding.title}</h3>
                  <div className="text-xs font-mono text-indigo-400 mt-1">Rule ID: {selectedFinding.rule_id}</div>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                  aria-label="Close detail view"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">Description</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80 break-words">
                    {selectedFinding.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Affected Code Snippet</h4>
                  <CodeHighlighter
                    snippet={selectedFinding.code_snippet}
                    lineNumber={selectedFinding.line_number}
                    filePath={selectedFinding.file_path}
                  />
                </div>

                {selectedFinding.suggested_fix && (
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 mb-1">Suggested Fix / Remediation</h4>
                    <p className="text-xs text-emerald-200/90 leading-relaxed bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40 font-mono break-all">
                      {selectedFinding.suggested_fix}
                    </p>
                  </div>
                )}

                {selectedFinding.vulnerability && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400">Resolution Audit History</h4>
                    <VulnerabilityTimeline history={selectedFinding.vulnerability.history} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
