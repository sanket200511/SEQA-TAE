# Database Design — CodeLens

The PostgreSQL schema uses four core tables:

### 1. `analysis_runs`
- `id` (INT PK): Primary key
- `tool` (VARCHAR): Static analysis tool (e.g., Bandit, ESLint, Semgrep, Pylint, CSV)
- `filename` (VARCHAR): Uploaded log name
- `imported_at` (TIMESTAMP): Upload timestamp
- `total_findings` (INT): Total items parsed
- `status` (VARCHAR): Status (Completed / Failed)

### 2. `findings`
- `id` (INT PK): Primary key
- `analysis_run_id` (INT FK -> analysis_runs.id)
- `rule_id` (VARCHAR): Original rule identifier
- `title` (VARCHAR): Normalized finding title
- `description` (TEXT): Detailed rule explanation
- `category` (VARCHAR): Security Vulnerability | Code Smell | Bug | Performance | Maintainability
- `severity` (VARCHAR): Critical | High | Medium | Low | Informational
- `file_path` (VARCHAR): Target source file
- `line_number` (INT): Target line
- `column_number` (INT): Target column
- `code_snippet` (TEXT): Vulnerable source code snippet
- `suggested_fix` (TEXT): Remediation guidance
- `fingerprint` (VARCHAR): SHA-256 issue signature
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### 3. `vulnerabilities`
- `id` (INT PK)
- `finding_id` (INT FK -> findings.id)
- `status` (VARCHAR): OPEN | IN PROGRESS | RESOLVED
- `resolution` (VARCHAR): Fixed | False Positive | Ignored
- `resolution_note` (TEXT): Remediation comments
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `resolved_at` (TIMESTAMP)

### 4. `vulnerability_history`
- `id` (INT PK)
- `vulnerability_id` (INT FK -> vulnerabilities.id)
- `old_status` (VARCHAR)
- `new_status` (VARCHAR)
- `note` (TEXT)
- `changed_at` (TIMESTAMP)
