import React, { useEffect, useState } from 'react';
import { ShieldAlert, Sparkles, AlertCircle, CheckCircle2, ListTree, ArrowUpRight, FolderPlus, FolderX } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { DashboardMetrics, Project } from '../types';
import { fetchDashboardMetrics } from '../services/api';

interface DashboardPageProps {
  activeProject: Project | null;
  onNavigateTab: (tab: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeProject, onNavigateTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardMetrics(activeProject?.id)
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading SQA metrics...</div>;
  }

  // State 1: No Project Selected
  if (!activeProject) {
    return (
      <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center justify-center mx-auto">
          <FolderX size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-100">No Project Selected</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select or create a project to continue visualizing software quality metrics.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onNavigateTab('import')}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all min-h-[44px]"
          >
            Go to Import & Project Setup
          </button>
        </div>
      </div>
    );
  }

  // State 2: Project selected, but 0 findings / runs
  const isEmpty = !metrics || metrics.total_findings === 0;

  if (isEmpty) {
    return (
      <div className="p-6 sm:p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
          <FolderPlus size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-100">
            Project "{activeProject.name}" has no analysis runs yet
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Run a static analysis tool (e.g. Bandit, ESLint, Pylint, Semgrep) locally on your code, then import the generated JSON/CSV report into this project.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onNavigateTab('import')}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all min-h-[44px]"
          >
            Import Analysis Report
          </button>
        </div>
      </div>
    );
  }

  const categoryData = Object.entries(metrics.findings_by_category).map(([name, value]) => ({ name, value }));
  const severityData = Object.entries(metrics.vulnerabilities_by_severity).map(([name, value]) => ({ name, value }));
  const statusData = Object.entries(metrics.vulnerability_status).map(([name, value]) => ({ name, value }));
  const smellData = Object.entries(metrics.code_smell_distribution).map(([name, value]) => ({ name, value }));

  const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#EF4444',
    High: '#F97316',
    Medium: '#F59E0B',
    Low: '#10B981',
    Informational: '#3B82F6',
  };

  const STATUS_COLORS: Record<string, string> = {
    OPEN: '#EF4444',
    'IN PROGRESS': '#3B82F6',
    RESOLVED: '#10B981',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Findings</span>
            <ListTree size={16} className="text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-100">{metrics.total_findings}</div>
          <p className="text-[11px] text-slate-500 truncate">In project '{activeProject.name}'</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
            <span>Code Smells</span>
            <Sparkles size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-200">{metrics.code_smells_count}</div>
          <button onClick={() => onNavigateTab('code-smells')} className="text-[11px] text-purple-400 hover:underline flex items-center gap-1">
            <span>Inspect categories</span>
            <ArrowUpRight size={10} />
          </button>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
            <span>Security Vulns</span>
            <ShieldAlert size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-200">{metrics.security_vulnerabilities_count}</div>
          <button onClick={() => onNavigateTab('security')} className="text-[11px] text-rose-400 hover:underline flex items-center gap-1">
            <span>Track vulnerabilities</span>
            <ArrowUpRight size={10} />
          </button>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Open Vulns</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-200">{metrics.open_vulnerabilities}</div>
          <p className="text-[11px] text-slate-500">Requires remediation</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Resolved Vulns</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-200">{metrics.resolved_vulnerabilities}</div>
          <p className="text-[11px] text-slate-500">Verified remediated</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">Findings by Category — {activeProject.name}</h3>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">Security Vulnerabilities by Severity</h3>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">Vulnerability Resolution Lifecycle</h3>
          <div className="h-56 sm:h-64 flex items-center justify-center w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={STATUS_COLORS[entry.name] || '#3B82F6'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-200 truncate">Top Code Smell Subcategories</h3>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={smellData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
