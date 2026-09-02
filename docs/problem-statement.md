# SQA Problem Statement — CodeLens

## Problem Definition
Static code analysis tools (such as SonarQube, Bandit, ESLint, Semgrep, and Pylint) generate voluminous, tool-specific findings in JSON, XML, or CSV logs. In Software Engineering & Quality Assurance (SEQA), modern engineering teams face three primary challenges:
1. **Tool-Specific Fragmentation**: Each static analysis tool emits findings in distinct schemas and nomenclature.
2. **Lack of Vulnerability Resolution Traceability**: Raw logs provide a point-in-time snapshot, making it difficult to track defect states from `OPEN` to `IN PROGRESS` to `RESOLVED`.
3. **Absence of SQA Categorization**: Raw logs mix minor style violations with critical security vulnerabilities and architectural code smells.

## Objective
CodeLens resolves this problem by providing a normalized full-stack dashboard that:
1. **Imports & Parses** raw log files from multiple static analysis engines.
2. **Normalizes** findings into standardized severity and rule models.
3. **Categorizes** code smells (e.g. *High Cyclomatic Complexity*, *Unused Variables*, *Duplicate Code*) and security defects (e.g. *SQL Injection*, *Hardcoded Secrets*, *Command Injection*).
4. **Tracks** security vulnerability resolution through a state machine (`OPEN` -> `IN PROGRESS` -> `RESOLVED`) with an immutable audit timeline.
