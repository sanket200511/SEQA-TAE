# CodeLens — Static Code Analysis Log Visualizer

**CodeLens** is a Software Engineering & Quality Assurance (SEQA) platform designed for live demonstrations and production deployment on **Render**.

It provides a centralized visualizer for developers to create **real project scopes**, import static analysis logs (**Bandit**, **ESLint**, **Semgrep**, **Pylint**, **CSV**), normalize findings into SQA categories (*Code Smells*, *Security Vulnerabilities*), and track defect resolution lifecycle across multiple scans.

---

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite → **Render Static Site**
- **Backend**: FastAPI + Uvicorn → **Render Web Service**
- **Database**: PostgreSQL → **Render PostgreSQL**

---

## 🚀 Local Development Setup

### Requirements
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally on port 5432

### 1. Database & Environment Setup
1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE codelens;
   ```
2. Create `.env` in project root or `backend/.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/codelens
   ENVIRONMENT=development
   LOG_LEVEL=INFO
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```
3. Run Alembic database migrations:
   ```bash
   cd backend
   python -m alembic upgrade head
   ```

### 2. Start Services
- **Backend API**:
  ```bash
  cd backend
  python run.py
  ```
  *(API runs at http://localhost:8000. Docs at http://localhost:8000/docs. Health check at http://localhost:8000/health)*

- **Frontend Web App**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  *(App runs at http://localhost:5173)*

### 3. (Optional) Seed Demo Data
To populate sample static analysis runs into a dedicated `"Sample Demo Project"` for testing:
```bash
cd backend
python seed.py
```

---

## ☁️ Render Deployment Guide

### Option A: Automatic Blueprint Deployment (`render.yaml`)

1. Push your repository to GitHub.
2. Log into [Render Dashboard](https://dashboard.render.com/) and click **New → Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml` and provision:
   - **PostgreSQL Database**: `codelens-db`
   - **Backend Service**: `codelens-backend`
   - **Frontend Static Site**: `codelens-frontend`
4. Click **Apply**. Render will automatically run build commands, migrations, and wire environment variables.

---

### Option B: Manual Render Setup

#### 1. Create Render PostgreSQL
- Click **New → PostgreSQL**.
- **Name**: `codelens-db`
- **Database**: `codelens`
- Copy the **Internal Database URL** once provisioned.

#### 2. Deploy Backend Web Service
- Click **New → Web Service**.
- **Environment**: Python
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `DATABASE_URL`: *(Paste Render Internal Database URL)*
  - `FRONTEND_URL`: `https://codelens-frontend.onrender.com`
  - `ENVIRONMENT`: `production`

#### 3. Deploy Frontend Static Site
- Click **New → Static Site**.
- **Root Directory**: `frontend`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule**: `/*` → `/index.html`
- **Environment Variables**:
  - `VITE_API_URL`: `https://codelens-backend.onrender.com`

---

## 🧪 Testing & Verification Commands

- **Backend Unit Tests**:
  ```bash
  cd backend
  python -m pytest -v
  ```
- **Frontend Typecheck & Build**:
  ```bash
  cd frontend
  npm run build
  ```

---

## 🛡️ Real-World Project Workflow

1. Open deployed CodeLens frontend.
2. Click **Create Project** → Name your project (e.g., `Healthcare API`).
3. Run analyzer locally in your repository:
   - **Bandit**: `bandit -r . -f json -o bandit-report.json`
   - **ESLint**: `npx eslint . -f json -o eslint-report.json`
   - **Semgrep**: `semgrep scan --json --output semgrep-report.json .`
   - **Pylint**: `pylint . --output-format=json > pylint-report.json`
4. Upload generated report file under your project scope.
5. Inspect metrics on **Dashboard**, findings in **Findings Explorer**, code smells in **Code Smells**, and track security resolution lifecycle on **Security Page**.
