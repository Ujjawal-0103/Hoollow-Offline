# Hackathon Full-Stack Development Kit (Offline Prep - npm)

A zero-friction, pre-configured development environment prepared for a 4–5 hour hackathon using **npm**. Designed to eliminate setup bottlenecks, prevent port collisions, and guarantee full compliance with hackathon rules.

---

## 1. Hackathon Rules & Preparation Mode

- **Current Preparation Mode:** `STRICT_FROM_SCRATCH`
- **Status:** Compliant. No application domain logic, pre-built feature code, or database entities have been pre-committed. All preparation is strictly restricted to tooling verification, Docker infrastructure, environment configuration, preflight automation, and team collaboration workflows.
- **Reference:** For detailed justification, see [docs/hackathon-rules.md](docs/hackathon-rules.md).

---

## 2. Technology Stack

| Layer | Technology | Version / Configuration | Purpose |
|-------|------------|-------------------------|---------|
| **Frontend** | Next.js, React, Tailwind CSS, TypeScript | App Router, TS 5+, Tailwind 3/4 | Fast UI, responsive layout, client API calls |
| **Backend** | NestJS, TypeScript | REST API, `/api` prefix, ValidationPipe | Robust modular backend, DTO validation |
| **Database** | PostgreSQL 16 Alpine, Prisma ORM | Host Port: `5435` (Docker) | Relational persistence, typed schema queries |
| **Package Manager** | `npm` | `v10.9.2` | Universal, Node.js bundled package manager with native workspaces |
| **Containers** | Docker Engine & Docker Compose | Docker `29.6.1`, Compose `v5.1.4` | Isolated database services |

---

## 3. Prerequisites

Before arriving at the venue, verify you have the following installed on your machine:
- **Node.js:** `v20.x` or `v22.x` LTS ([https://nodejs.org/](https://nodejs.org/))
- **npm:** `v10.x+` (Bundled with Node.js; update via `npm install -g npm@latest`)
- **Git:** `2.40+` ([https://git-scm.com/](https://git-scm.com/))
- **Docker Desktop:** Required if running containerized PostgreSQL ([https://www.docker.com/](https://www.docker.com/))

---

## 4. Quickstart & Verification (Run at Home & at Venue)

### Step 1: Clone and Enter Repository
```powershell
git clone https://github.com/Ujjawal-0103/Hoollow-Offline.git
cd Hoollow-Offline
```

### Step 2: Initialize Environment Variables
```powershell
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux / Git Bash
cp .env.example .env
```

### Step 3: Run the Automated Preflight Check
Verify tool installations, daemon availability, port accessibility, and network health:
```powershell
# Windows PowerShell
npm run preflight
# or directly:
powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1

# macOS / Linux / Git Bash
npm run preflight:bash
# or:
./scripts/preflight.sh
```

---

## 5. Database Setup (Docker Compose)

To prevent port conflicts with any existing local PostgreSQL service running on host port `5432` or other project containers (e.g. `traceback-postgres` on `5434`), the container binds to **host port `5435`**.

### Start Database
```powershell
npm run db:up
# Equivalent to: docker compose up -d postgres
```

### Check Logs & Health
```powershell
npm run db:logs
docker compose ps
```

### Stop Database
```powershell
npm run db:down
# Equivalent to: docker compose stop postgres
```

### Reset Database Volume (Fresh State)
```powershell
npm run db:clean
# Equivalent to: docker compose down -v
```

### Alternative: Local PostgreSQL (Without Docker)
If Docker is unavailable at the venue:
1. Ensure your local PostgreSQL service is running on port `5432`.
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@localhost:5432/hackathon?schema=public"
   ```

---

## 6. Minute 0 Venue Kickoff (When Hackathon Begins)

When the hackathon problem statement is announced and coding starts:

1. **Agree on Contract (15 min):** Fill out [docs/api-contract-template.md](docs/api-contract-template.md).
2. **Execute Venue Scaffolding:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\venue-kickoff.ps1
   ```
3. **Install Dependencies:**
   ```powershell
   npm install
   ```

---

## 7. Development & Verification Commands

| Command | Purpose | When to Run |
|---------|---------|-------------|
| `npm run preflight` | Run automated machine readiness audit | Before leaving home & at venue |
| `npm run db:up` | Launch PostgreSQL container on port 5435 | Before starting backend |
| `npm run db:down` | Gracefully stop PostgreSQL container | At end of day or when switching branches |
| `npm run db:logs` | Stream database container logs | When debugging database connections |
| `npm run dev --workspace=apps/web` | Start frontend application alone | During active UI development |
| `npm run start:dev --workspace=apps/api` | Start backend API application alone | During active API development |
| `npm test` | Run test suites | Before opening pull requests |
| `npm run lint` | Run ESLint across packages | Before committing |
| `npm run typecheck` | Run TypeScript compiler checks | Before merging to `main` |

---

## 8. Troubleshooting Guide

### 1. Docker Desktop Not Running
- **Symptom:** `error during connect: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
- **Safe Fix:** Open Docker Desktop from the Windows Start menu and wait for the status icon to turn green. Re-run `npm run preflight`.

### 2. Port 5432, 5434, or 5435 Already Occupied
- **Symptom:** `bind: address already in use` when starting PostgreSQL container.
- **Cause:** Another PostgreSQL service or daemon is listening on that port (e.g. host Postgres on `5432` or another container on `5434`).
- **Safe Fix:** We designed this kit to use port `5435` by default. If `5435` is also occupied:
  1. Inspect the PID via `npm run preflight`.
  2. Change `POSTGRES_PORT=5436` in `.env`.
  3. Update `DATABASE_URL` in `.env` to point to port `5436`.

### 3. Ports 3000 or 3001 Already Occupied
- **Symptom:** Next.js defaults to port `3002` or fails; NestJS throws `EADDRINUSE`.
- **Safe Fix:**
  - Find the occupying process:
    ```powershell
    Get-NetTCPConnection -LocalPort 3000, 3001 -State Listen
    ```
  - If it is a leftover dev server from a previous session, gracefully close that terminal or stop the process.
  - Alternatively, change `PORT=3002` in `.env` for the backend and update `NEXT_PUBLIC_API_BASE_URL=http://localhost:3002/api`.

### 4. Missing Environment Variables
- **Symptom:** Backend fails on startup with `undefined` connection string, or frontend cannot reach `/api`.
- **Safe Fix:** Verify `.env` exists in the project root. Re-copy from template: `Copy-Item .env.example .env`.

### 5. Prisma Client Not Generated
- **Symptom:** `Cannot find module '@prisma/client'` or `@prisma/client did not initialize yet`.
- **Safe Fix:**
  ```powershell
  npx prisma generate
  ```

### 6. Database Connection Refused (`ECONNREFUSED 127.0.0.1:5435`)
- **Symptom:** Backend logs show database connection failed.
- **Safe Fix:**
  1. Verify the container is running: `docker compose ps`.
  2. If exited, check logs: `npm run db:logs`.
  3. Verify PostgreSQL is healthy:
     ```powershell
     docker compose exec postgres pg_isready -U hackathon -d hackathon
     ```

### 7. Frontend Unable to Reach Backend (CORS or Network Error)
- **Symptom:** Browser console shows `CORS policy: No 'Access-Control-Allow-Origin' header` or `Failed to fetch`.
- **Safe Fix:**
  1. Verify backend is running on `http://localhost:3001`.
  2. Verify backend `CORS_ORIGIN` matches `http://localhost:3000`.
  3. Test backend health directly in your browser: `http://localhost:3001/api/health`.

### 8. Node.js or npm Version Mismatch
- **Symptom:** Syntax errors during install, npm warnings or version mismatch.
- **Safe Fix:** Ensure Node.js >= 20 is active (`node -v`). Upgrade npm to latest stable: `npm install -g npm@latest` or `npm install -g npm@10.9.2`.

---

## 9. Team Collaboration Quick Reference

- **Full Workflow:** Detailed guide in [docs/team-workflow.md](docs/team-workflow.md).
- **Branch Strategy:**
  - `feature/web-*` for UI
  - `feature/api-*` for backend
  - `feature/db-*` for database
- **Zero-Conflict Rule:** Frontend and Backend members edit strictly separated directories and coordinate through the frozen [docs/api-contract-template.md](docs/api-contract-template.md).
- **Workspace Execution:** Run commands with `--workspace=<path>`, e.g., `npm run dev --workspace=apps/web`.

---

## 10. Decisions Needed Once Problem Statement Is Announced

When the prompt is announced, make the following decisions in the first 15 minutes:
1. **Core Problem & Persona:** What is the exact 1 problem we are solving and for whom?
2. **Key User Journey:** What 3 screens are necessary for the pitch demo?
3. **Data Model:** What 2–4 database tables are required in `schema.prisma`?
4. **API Endpoints:** What 3–5 REST endpoints will fulfill the user journey?
5. **External Services:** Do we need an AI LLM (OpenAI/Gemini), image storage, or external API? If so, generate API keys and populate `.env`.
