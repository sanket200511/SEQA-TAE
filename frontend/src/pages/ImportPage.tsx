import React, { useState } from 'react';
import { Upload, Terminal, CheckCircle2, AlertCircle, ArrowRight, X, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { AnalysisPreview, Project } from '../types';
import { previewAnalysisLog, importAnalysisLog } from '../services/api';
import { SeverityBadge } from '../components/SeverityBadge';
import { CategoryBadge } from '../components/CategoryBadge';

interface ImportPageProps {
  projects: Project[];
  activeProject: Project | null;
  onSuccessImport: () => void;
}

export const ImportPage: React.FC<ImportPageProps> = ({ projects, activeProject, onSuccessImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(activeProject?.id);
  const [tool, setTool] = useState<string>('auto');
  const [preview, setPreview] = useState<AnalysisPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreview(null);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await previewAnalysisLog(selectedFile, tool);
      setPreview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to preview static analysis log');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    setLoadingImport(true);
    setError(null);
    try {
      await importAnalysisLog(selectedFile, selectedProjectId || activeProject?.id, tool);
      setSuccessMessage(`Analysis report '${selectedFile.name}' imported successfully into PostgreSQL.`);
      setPreview(null);
      setSelectedFile(null);
      onSuccessImport();
    } catch (err: any) {
      setError(err.message || 'Failed to import static analysis log');
    } finally {
      setLoadingImport(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const commands = [
    {
      id: 'bandit',
      name: 'Python — Bandit (Security SAST)',
      cmd: 'pip install bandit\nbandit -r . -f json -o bandit-report.json',
    },
    {
      id: 'pylint',
      name: 'Python — Pylint (Maintainability & Smells)',
      cmd: 'pip install pylint\npylint . --output-format=json > pylint-report.json',
    },
    {
      id: 'eslint',
      name: 'JavaScript / TypeScript — ESLint',
      cmd: 'npm install eslint\nnpx eslint . -f json -o eslint-report.json',
    },
    {
      id: 'semgrep',
      name: 'Semgrep (Multi-Language SAST)',
      cmd: 'semgrep scan --json --output semgrep-report.json .',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 w-full min-w-0">
      {/* Real Project Report Generation Guide */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-indigo-300 min-h-[44px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Terminal size={18} className="text-indigo-400 shrink-0" />
            <span className="truncate">How to Generate a Real Analysis Report locally in your Project</span>
          </div>
          {showCommands ? <ChevronUp size={16} className="shrink-0 ml-2" /> : <ChevronDown size={16} className="shrink-0 ml-2" />}
        </button>

        {showCommands && (
          <div className="space-y-3 pt-2 text-xs">
            <p className="text-slate-400">
              Run these commands inside your project's local directory to generate valid JSON reports for CodeLens import:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commands.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-slate-300 font-sans text-xs font-medium gap-2">
                    <span className="truncate">{item.name}</span>
                    <button
                      onClick={() => copyToClipboard(item.cmd, item.id)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0 min-h-[32px]"
                      title="Copy command"
                      aria-label="Copy command"
                    >
                      {copiedCmd === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre className="text-[11px] text-indigo-300 bg-slate-900 p-2.5 rounded overflow-x-auto whitespace-pre-wrap break-all">
                    {item.cmd}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Upload Box */}
      <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">Upload Static Code Analysis Report</h3>
          <p className="text-xs text-slate-400 mt-1">
            Import real static analysis JSON/CSV output to normalize findings and track resolution lifecycle.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-0.5">Import Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {!preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Project Scope</label>
                <select
                  value={selectedProjectId || activeProject?.id || ''}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name} ({p.primary_language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Analysis Tool Parser</label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
                >
                  <option value="auto">⚡ Auto-Detect Report Format</option>
                  <option value="Bandit">Bandit (Python Security)</option>
                  <option value="ESLint">ESLint (JS/TS Linter)</option>
                  <option value="Semgrep">Semgrep (SAST)</option>
                  <option value="Pylint">Pylint (Python Linter)</option>
                  <option value="CSV">CSV Generic Format</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 sm:p-8 text-center transition-colors bg-slate-950/40">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".json,.csv,.xml,.txt,.log"
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <Upload size={24} />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-medium text-slate-200 break-all">
                    {selectedFile ? selectedFile.name : 'Click to select report file (.json, .csv)'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Upload generated Bandit, ESLint, Semgrep, Pylint, or CSV report</p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handlePreview}
                  disabled={loadingPreview}
                  className="w-full sm:w-auto px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {loadingPreview ? 'Parsing File...' : (
                    <>
                      <span>Parse & Preview Findings</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Confirmation Panel */}
        {preview && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-indigo-400 font-medium">Detected Analyzer</div>
                <div className="text-base sm:text-lg font-bold text-slate-100">{preview.tool}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 break-all">{preview.filename}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400">Findings</div>
                  <div className="text-base font-bold text-slate-100">{preview.total_findings}</div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-900/50 text-center">
                  <div className="text-[10px] text-rose-400">Security</div>
                  <div className="text-base font-bold text-rose-200">{preview.security_vulnerabilities}</div>
                </div>

                <div className="px-3 py-2 rounded-lg bg-purple-950/40 border border-purple-900/50 text-center">
                  <div className="text-[10px] text-purple-400">Smells</div>
                  <div className="text-base font-bold text-purple-200">{preview.code_smells}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Normalized Findings Preview</h4>
              <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                  <thead className="bg-slate-900 sticky top-0 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Rule</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {preview.findings.slice(0, 15).map((f, i) => (
                      <tr key={i} className="hover:bg-slate-900/50">
                        <td className="p-3"><SeverityBadge severity={f.severity} size="sm" /></td>
                        <td className="p-3"><CategoryBadge category={f.category} /></td>
                        <td className="p-3 font-mono text-indigo-400">{f.rule_id}</td>
                        <td className="p-3 text-slate-200 font-medium">{f.title}</td>
                        <td className="p-3 font-mono text-slate-400 break-all">{f.file_path}:{f.line_number || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setPreview(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <X size={14} />
                <span>Cancel Import</span>
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={loadingImport}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loadingImport ? 'Importing Analysis...' : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm & Save to Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
