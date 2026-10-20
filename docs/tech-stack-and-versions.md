# Technology Stack & Version Matrix

This document defines the verified runtime versions, planned framework dependencies, and network resilience guidelines for the hackathon.

## 1. Verified Local Development Environment

Audited on developer machine:
- **Operating System:** Windows 11 / Windows PowerShell 5.1 / PowerShell 7
- **Node.js:** `v22.17.0` (LTS compatible, engine >= 18.0.0 supported)
- **Package Manager:** `npm v10.9.2` (Default Node.js package manager, npm workspaces native)
- **Version Control:** `git version 2.50.1.windows.1`
- **Docker Engine:** `Docker version 29.6.1`
- **Docker Compose:** `Docker Compose version v5.1.4`

## 2. Planned Full-Stack Architecture (For Venue Kickoff)

When application development begins:

### Frontend
- **Framework:** Next.js (App Router, React 18/19, TypeScript)
- **Styling:** Tailwind CSS (utility-first, responsive, zero-runtime overhead)
- **HTTP Client:** Native `fetch` with typed API wrapper or Axios
- **Default Port:** `3000` (configurable via `.env`)
- **API Base URL:** `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api`

### Backend
- **Framework:** NestJS (TypeScript, modular architecture)
- **Routing:** RESTful controllers with global prefix `/api`
- **Validation:** `class-validator` and `class-transformer` via global `ValidationPipe`
- **CORS:** Enabled for `http://localhost:3000`
- **Default Port:** `3001` (configurable via `.env`)
- **Health Check Endpoint:** `GET /api/health`

### Database
- **Engine:** PostgreSQL 16 Alpine (`postgres:16-alpine`)
- **Container Host Port:** `5435` (mapped to internal `5432` to avoid collisions with native host PostgreSQL on 5432 and external project containers on 5434)
- **ORM:** Prisma ORM
- **Connection String:** `postgresql://hackathon:localdev_only_change_me@localhost:5435/hackathon?schema=public`

## 3. Port Allocation Map

| Port | Service | Host Mapping | Purpose |
|------|---------|--------------|---------|
| `3000` | Next.js Web App | Localhost | User-facing application |
| `3001` | NestJS API | Localhost | REST backend API |
| `5435` | PostgreSQL (Docker) | `127.0.0.1:5435 -> 5432` | Primary persistent database (Hoollow-Offline) |
| `5434` | External Project PostgreSQL | `127.0.0.1:5434 -> 5432` | Reserved by external container (e.g. traceback-postgres) |
| `5432` | Host PostgreSQL | *Reserved/Host* | Native Postgres if installed on host (isolated) |

## 4. Offline & Network Resilience Strategy

Hackathon Wi-Fi networks frequently become congested or degrade during peak hours. Follow these practices:

1. **Pre-Cache npm / npx Binaries:**
   Ensure npm and npx have cached core dependencies on your laptop before arriving:
   ```powershell
   # Warms npx cache for Next.js, React, NestJS, and Prisma
   npx --yes create-next-app@latest --help
   npx --yes @nestjs/cli@latest --help
   ```

2. **Pre-Pull PostgreSQL Docker Image:**
   Pull the database container image at home over high-speed internet:
   ```powershell
   docker pull postgres:16-alpine
   ```

3. **Zero Mandatory Cloud Dependencies:**
   - The core application must run 100% locally on localhost without requiring internet access.
   - If AI features (e.g. Gemini, OpenAI) are added after the prompt is revealed, wrap all AI calls in fallback/mock handlers so judges can evaluate UI and core features even if venue Wi-Fi drops or API rate limits trigger.
