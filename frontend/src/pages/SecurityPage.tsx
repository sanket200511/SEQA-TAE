import React, { useEffect, useState } from 'react';
import { ShieldAlert, Clock, Bot, UserCheck, FolderX, FolderPlus, X } from 'lucide-react';
import { Finding, Vulnerability, Project } from '../types';
import { fetchSecurityVulnerabilities, fetchAnalysisHistory } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { ResolutionModal } from '../components/ResolutionModal';
import { VulnerabilityTimeline } from '../components/VulnerabilityTimeline';
import { CodeHighlighter } from '../components/CodeHighlighter';

interface SecurityPageProps {
  activeProject: Project | null;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ activeProject }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [hasAnalysisRuns, setHasAnalysisRuns] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedVulnFinding, setSelectedVulnFinding] = useState<Finding | null>(null);
  const [editingVuln, setEditingVuln] = useState<Vulnerability | null>(null);

  const loadData = () => {
    if (!activeProject) {
      setFindings([]);
      setHasAnalysisRuns(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAnalysisHistory(activeProject.id).then((history) => {
      setHasAnalysisRuns(history.length > 0);
      return fetchSecurityVulnerabilities(activeProject.id, statusFilter || undefined);
    })
      .then(setFindings)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id, statusFilter]);

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
  if (!loading && !hasAnalysisRuns) {
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

  const openVulnerabilitiesCount = findings.filter(f => f.vulnerability?.status === 'OPEN').length;
  const inProgressCount = findings.filter(f => f.vulnerability?.status === 'IN PROGRESS').length;
  const resolvedCount = findings.filter(f => f.vulnerability?.status === 'RESOLVED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 rounded-xl bg-rose-950/25 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-rose-200 flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-400 shrink-0" />
            <span className="truncate">Security Vulnerabilities & Resolution Tracking</span>
          </h3>
          <p className="text-xs text-rose-300/80 mt-1">
            Track security defects in '{activeProject.name}' through their lifecycle: OPEN → IN PROGRESS → RESOLVED.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-rose-900/40 text-center">
            <div className="text-[10px] text-rose-400 font-medium">Open</div>
            <div className="text-base sm:text-xl font-bold text-rose-200">{openVulnerabilitiesCount}</div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-sky-900/40 text-center">
            <div className="text-[10px] text-sky-400 font-medium">Progress</div>
            <div className="text-base sm:text-xl font-bold text-sky-200">{inProgressCount}</div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-emerald-900/40 text-center">
            <div className="text-[10px] text-emerald-400 font-medium">Resolved</div>
            <div className="text-base sm:text-xl font-bold text-emerald-200">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
            statusFilter === '' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({findings.length})
        </button>
        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
            statusFilter === 'OPEN' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Open ({openVulnerabilitiesCount})
        </button>
        <button
          onClick={() => setStatusFilter('IN PROGRESS')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
            statusFilter === 'IN PROGRESS' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
            statusFilter === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={selectedVulnFinding ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading security vulnerabilities...</div>
            ) : findings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No security vulnerabilities detected for project "{activeProject.name}".
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {findings.map((f) => {
                  const isSelected = selectedVulnFinding?.id === f.id;
                  const vuln = f.vulnerability;

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedVulnFinding(f)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected ? 'bg-rose-950/30 border-l-4 border-rose-500' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SeverityBadge severity={f.severity} size="sm" />
                            <span className="font-mono text-xs text-indigo-400">{f.rule_id}</span>
                            {vuln && <StatusBadge status={vuln.status} size="sm" />}
                            {vuln?.status === 'RESOLVED' && vuln.resolution_source === 'Automatic Scan Verification' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                                <Bot size={10} />
                                <span>Auto Scan Verified</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-100 break-all">{f.title}</h4>
                          <p className="text-[11px] text-slate-400 font-mono break-all">
                            {f.file_path}:{f.line_number || 1}
                          </p>
                        </div>

                        {vuln && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVuln(vuln);
                            }}
                            className="px-3.5 py-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shrink-0 transition-colors self-start sm:self-auto min-h-[40px]"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Vulnerability Detail Panel (Mobile Modal + Desktop Sticky Panel) */}
        {selectedVulnFinding && (
          <div className="fixed inset-0 z-50 p-3 sm:p-4 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:block lg:col-span-6">
            <div className="w-full max-w-lg lg:max-w-none max-h-[90vh] lg:max-h-none overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-6 shadow-2xl lg:shadow-none sticky lg:top-20">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <SeverityBadge severity={selectedVulnFinding.severity} size="md" />
                    {selectedVulnFinding.vulnerability && (
                      <StatusBadge status={selectedVulnFinding.vulnerability.status} size="md" />
                    )}
                    {selectedVulnFinding.vulnerability?.resolution_source && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        {selectedVulnFinding.vulnerability.resolution_source === 'Automatic Scan Verification' ? (
                          <>
                            <Bot size={12} className="text-indigo-400 shrink-0" />
                            <span>Auto Scan Verified</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} className="text-emerald-400 shrink-0" />
                            <span>Developer Manual Resolution</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 break-all">{selectedVulnFinding.title}</h3>
                  <div className="text-xs font-mono text-indigo-400 mt-1">Rule ID: {selectedVulnFinding.rule_id}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedVulnFinding.vulnerability && (
                    <button
                      onClick={() => setEditingVuln(selectedVulnFinding.vulnerability!)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors min-h-[36px]"
                    >
                      Change Status
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVulnFinding(null)}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center lg:hidden"
                    aria-label="Close details"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1">Vulnerability Details</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 break-words">
                    {selectedVulnFinding.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Vulnerable Code Snippet</h4>
                  <CodeHighlighter
                    snippet={selectedVulnFinding.code_snippet}
                    lineNumber={selectedVulnFinding.line_number}
                    filePath={selectedVulnFinding.file_path}
                  />
                </div>

                {selectedVulnFinding.suggested_fix && (
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-400 mb-1">Suggested Fix</h4>
                    <div className="text-xs text-emerald-200 bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/40 font-mono break-all">
                      {selectedVulnFinding.suggested_fix}
                    </div>
                  </div>
                )}

                {selectedVulnFinding.vulnerability?.history && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Clock size={14} className="text-indigo-400 shrink-0" />
                      <span>Resolution Lifecycle Audit Timeline</span>
                    </h4>
                    <VulnerabilityTimeline history={selectedVulnFinding.vulnerability.history} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Status Change Modal */}
      {editingVuln && (
        <ResolutionModal
          vulnerability={editingVuln}
          onClose={() => setEditingVuln(null)}
          onSuccess={() => {
            loadData();
            setSelectedVulnFinding(null);
          }}
        />
      )}
    </div>
  );
};
