# User Guide — CodeLens

## 1. Importing a Static Analysis Log
1. Click **Import Analysis** in the left sidebar.
2. Choose an analysis tool (e.g. Bandit, ESLint, Semgrep, Pylint, CSV) or keep **Auto-Detect Tool Format**.
3. Select a report file (you can use sample files from `sample_logs/`).
4. Click **Parse & Preview Log**.
5. Inspect the parsed summary (total findings, security vulnerabilities, code smells) and preview table.
6. Click **Confirm & Import Analysis** to persist to the database.

## 2. Tracking Security Vulnerability Resolutions
1. Navigate to **Security Vulnerabilities** in the sidebar.
2. Filter vulnerabilities by status (`OPEN`, `IN PROGRESS`, `RESOLVED`).
3. Click on a vulnerability card to expand its details and vulnerable code snippet.
4. Click **Update Status** / **Change Status**.
5. Select the new state (`IN PROGRESS` or `RESOLVED`), specify a resolution type (*Fixed*, *False Positive*, *Ignored*), and type a resolution note.
6. Observe the **Resolution Lifecycle Audit Timeline** update with your status change.

## 3. Categorizing Code Smells
1. Navigate to **Code Smells** in the sidebar.
2. Select smell subcategories (*High Cyclomatic Complexity*, *Unused Variable*, *Duplicate Code*, *Deep Nesting*, *Magic Number*, *Poor Naming*).
3. View hotspot files containing the highest concentration of maintainability smells.

## 4. Comparing Scans (Regression Detection)
1. Click **Compare Scans** in the top navigation bar.
2. Select two analysis runs to compare.
3. Review **New Findings (Regressions)**, **Resolved Findings**, and **Persistent Findings**.
