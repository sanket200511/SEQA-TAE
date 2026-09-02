import { 
  Project,
  DashboardMetrics, 
  Finding, 
  AnalysisRun, 
  AnalysisPreview, 
  CodeSmellsResponse, 
  ScanCompareResult,
  VulnerabilityStatus 
} from '../types';

let rawUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/$/, '') : '';
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
const API_BASE = `${rawUrl}/api`;

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    throw new Error('Unable to connect to CodeLens API server. Please verify backend service status.');
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await safeFetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name: string, description?: string, primary_language: string = 'Python'): Promise<Project> {
  const res = await safeFetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, primary_language }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function fetchDashboardMetrics(projectId?: number): Promise<DashboardMetrics> {
  const query = projectId ? `?project_id=${projectId}` : '';
  const res = await safeFetch(`${API_BASE}/dashboard${query}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function previewAnalysisLog(file: File, tool?: string): Promise<AnalysisPreview> {
  const formData = new FormData();
  formData.append('file', file);
  if (tool && tool !== 'auto') formData.append('tool', tool);

  const res = await safeFetch(`${API_BASE}/analysis/preview`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to preview log file' }));
    throw new Error(err.detail || 'Failed to preview log file');
  }
  return res.json();
}

export async function importAnalysisLog(file: File, projectId?: number, tool?: string): Promise<AnalysisRun> {
  const formData = new FormData();
  formData.append('file', file);
  if (tool && tool !== 'auto') formData.append('tool', tool);
  if (projectId) formData.append('project_id', projectId.toString());

  const res = await safeFetch(`${API_BASE}/analysis/import`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to import log file' }));
    throw new Error(err.detail || 'Failed to import log file');
  }
  return res.json();
}

export async function fetchAnalysisHistory(projectId?: number): Promise<AnalysisRun[]> {
  const query = projectId ? `?project_id=${projectId}` : '';
  const res = await safeFetch(`${API_BASE}/analysis/history${query}`);
  if (!res.ok) throw new Error('Failed to fetch analysis history');
  return res.json();
}

export async function fetchFindings(params?: {
  projectId?: number;
  category?: string;
  severity?: string;
  status?: string;
  tool?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Finding[]> {
  const query = new URLSearchParams();
  if (params?.projectId) query.append('project_id', params.projectId.toString());
  if (params?.category) query.append('category', params.category);
  if (params?.severity) query.append('severity', params.severity);
  if (params?.status) query.append('status', params.status);
  if (params?.tool) query.append('tool', params.tool);
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const res = await safeFetch(`${API_BASE}/findings?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json();
}

export async function fetchSecurityVulnerabilities(projectId?: number, status?: string, severity?: string): Promise<Finding[]> {
  const query = new URLSearchParams();
  if (projectId) query.append('project_id', projectId.toString());
  if (status) query.append('status', status);
  if (severity) query.append('severity', severity);

  const res = await safeFetch(`${API_BASE}/security?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch security vulnerabilities');
  return res.json();
}

export async function updateVulnerabilityStatus(
  vulnId: number,
  status: VulnerabilityStatus,
  resolution?: string,
  note?: string
) {
  const res = await safeFetch(`${API_BASE}/security/${vulnId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, resolution, resolution_source: 'Manual', note }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update vulnerability status' }));
    throw new Error(err.detail || 'Failed to update vulnerability status');
  }
  return res.json();
}

export async function fetchCodeSmellsSummary(projectId?: number): Promise<CodeSmellsResponse> {
  const query = projectId ? `?project_id=${projectId}` : '';
  const res = await safeFetch(`${API_BASE}/code-smells${query}`);
  if (!res.ok) throw new Error('Failed to fetch code smells summary');
  return res.json();
}

export async function compareScans(runA: number, runB: number): Promise<ScanCompareResult> {
  const res = await safeFetch(`${API_BASE}/compare?run_a=${runA}&run_b=${runB}`);
  if (!res.ok) throw new Error('Failed to compare scans');
  return res.json();
}
