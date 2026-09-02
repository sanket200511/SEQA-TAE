# System Architecture — CodeLens

```text
               Raw Log Report (JSON/CSV)
                         │
                         ▼
             ┌───────────────────────┐
             │    Import & Parser    │
             │       Registry        │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ SQA Categorization &  │
             │ Fingerprint Generator │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  FastAPI REST API &   │
             │ SQLAlchemy ORM Engine │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ PostgreSQL Database   │
             └───────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ React / Vite Frontend │
             │  (Recharts, Tailwind) │
             └───────────────────────┘
```

## Backend Pipeline
- **FastAPI Framework**: High performance async REST routes.
- **SQLAlchemy (ORM)**: Database layer connecting to local PostgreSQL.
- **Alembic**: Database schema migration system.

## Parser & Normalization Layer
- Extensible `AnalysisParser` interface.
- Concrete parsers for ESLint, Bandit, Semgrep, Pylint, and CSV logs.
- Fingerprinting logic computes SHA256 hashes based on rule, file path, and normalized code snippets to track issues across scans.
