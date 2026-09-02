export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export type Category = 
  | 'Security Vulnerability' 
  | 'Code Smell' 
  | 'Bug' 
  | 'Performance' 
  | 'Maintainability' 
  | 'Reliability' 
  | 'Other';

export type VulnerabilityStatus = 'OPEN' | 'IN PROGRESS' | 'RESOLVED';

export interface Project {
  id: number;
  name: string;
  description?: string;
  primary_language: string;
  created_at: string;
  updated_at: string;
}

export interface VulnerabilityHistory {
  id: number;
  vulnerability_id: number;
  old_status: string;
  new_status: string;
  note?: string;
  changed_at: string;
}

export interface Vulnerability {
  id: number;
  finding_id: number;
  status: VulnerabilityStatus;
  resolution?: string;
  resolution_source?: 'Manual' | 'Automatic Scan Verification' | string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  history: VulnerabilityHistory[];
}

export interface Finding {
  id: number;
  analysis_run_id: number;
  rule_id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  file_path: string;
  line_number?: number;
  column_number?: number;
  code_snippet?: string;
  suggested_fix?: string;
  fingerprint: string;
  created_at: string;
  vulnerability?: Vulnerability;
}

export interface AnalysisRun {
  id: number;
  project_id: number;
  tool: string;
  filename: string;
  imported_at: string;
  total_findings: number;
  files_analyzed: number;
  status: string;
}

export interface NormalizedFinding {
  rule_id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  file_path: string;
  line_number?: number;
  column_number?: number;
  code_snippet?: string;
  suggested_fix?: string;
}

export interface AnalysisPreview {
  tool: string;
  filename: string;
  total_findings: number;
  security_vulnerabilities: number;
  code_smells: number;
  other_findings: number;
  findings: NormalizedFinding[];
}

export interface DashboardMetrics {
  total_findings: number;
  code_smells_count: number;
  security_vulnerabilities_count: number;
  open_vulnerabilities: number;
  resolved_vulnerabilities: number;
  findings_by_category: Record<string, number>;
  vulnerabilities_by_severity: Record<string, number>;
  vulnerability_status: Record<string, number>;
  code_smell_distribution: Record<string, number>;
}

export interface CodeSmellSummaryItem {
  category: string;
  count: number;
  affected_files_count: number;
  findings: Finding[];
}

export interface CodeSmellsResponse {
  total_code_smells: number;
  smell_categories: CodeSmellSummaryItem[];
  hotspot_files: Array<{ file: string; count: number }>;
}

export interface ScanCompareResult {
  run_a: { id: number; filename: string; tool: string; imported_at: string; total: number };
  run_b: { id: number; filename: string; tool: string; imported_at: string; total: number };
  summary: { total_change: number; new_count: number; resolved_count: number; persistent_count: number };
  new_findings: Finding[];
  resolved_findings: Finding[];
  persistent_findings: Finding[];
}
