# Hoollow API Backend

Backend REST API for **Hoollow**, an AI-powered personalized learning platform.

---

## 1. Project Overview

Hoollow guides learners through their educational journey:
**Plan → Learn → Practice → Track Progress → Revise → Level Up**.

This backend service implements the foundational architecture (Part 1), Learner Profiles & Structured Roadmaps (Part 2), In-App Learning & Progress Tracking (Part 3), Quiz & Assessment System (Part 4), and Industry Intelligence & Dynamic Roadmaps (Part 5), including:
- HTTP server configuration with TypeScript, Express, and CORS.
- Zod-validated environment variables and centralized error handling.
- Prisma 6 ORM schema with PostgreSQL persistence for Learners, Roadmaps, Milestones, Lessons, LessonProgress, Quizzes, QuizQuestions, QuizAttempts, QuizResponses, IndustrySources, IndustryEvents, Skills, RoadmapVersions, RoadmapUpdates, Notifications, and ResourceRecommendations.
- Deterministic, template-based curriculum generator for skills (e.g. Web Development).
- Learner-specific lesson completion tracking (idempotent, isolated per learner).
- Real-time progress metric calculations across roadmaps with safe rounding.
- Deterministic daily learning plan recommendations based on learner daily minutes.
- Quiz & Assessment system with pre-submission answer sanitization, server scoring, and attempts history.
- **Industry Intelligence & Dynamic Roadmaps System (Part 5)**:
  - Background worker polling configured industry sources (RSS feeds, official GitHub release notes).
  - Strict SSRF protection, request timeouts, and response size limits.
  - Content deduplication using canonical URLs and SHA-256 content hashes.
  - Canonical Skill Catalog mapping tech events to curriculum skills.
  - AI Industry Analysis with prompt injection defenses and deterministic heuristic fallbacks.
  - Transparent impact scoring and risk-based approval policies (`LOW`, `MEDIUM`, `HIGH`).
  - Atomic roadmap versioning: creates snapshot `RoadmapVersion` records, increments versions (`v1`, `v2`), preserves completed learner progress, and adds new lessons.
  - Automatic integration with daily plans (new approved lessons become eligible; completed work remains completed).
  - Educational video and learning resource recommendations with YouTube Data API and curated fallback channels.
  - In-app learner notifications for applied roadmap updates with read state tracking.
- Automated tests with Vitest and Supertest (**80 automated tests across 5 test suites**).

---

## 2. Technology Stack

- **Runtime:** Node.js (v22+ LTS)
- **Language:** TypeScript 5.7+ (strict mode enabled)
- **Framework:** Express.js 4.21+
- **Frontend App:** Next.js 16.4+ (React 19, TailwindCSS v4, Turbopack)
- **Database ORM:** Prisma ORM 6.19.3
- **Database Engine:** PostgreSQL 16 (via Docker or local instance)
- **Validation:** Zod 3.24+
- **Environment Management:** dotenv 16.4+
- **Development Tooling:** tsx (watch mode with instant TS execution)
- **Test Suite:** Vitest 3.2+ with Supertest 7.0+
- **Package Manager:** npm (v10.9+) with native npm workspaces

---

## 3. Project Structure

```
apps/api/
├── prisma/
│   └── schema.prisma             # PostgreSQL schema (all domain models)
├── src/
│   ├── config/
│   │   └── env.ts                # Zod-validated environment schema & parser
│   ├── controllers/
│   │   ├── daily-plan.controller.ts         # Daily learning plan recommendations
│   │   ├── health.controller.ts             # Health & readiness probes
│   │   ├── industry.controller.ts           # Industry sources, scanning, events, and status
│   │   ├── learner.controller.ts            # Learner creation, retrieval & preference updates
│   │   ├── lesson.controller.ts             # Lesson retrieval, completion & quizzes
│   │   ├── notification.controller.ts       # In-app learner notifications
│   │   ├── progress.controller.ts           # Learner progress summary metrics
│   │   ├── quiz.controller.ts               # Quiz creation, retrieval, submission & attempts
│   │   ├── recommendation.controller.ts     # Educational video recommendations
│   │   ├── roadmap-adaptation.controller.ts # Roadmap updates, approval, rejection & versions
│   │   └── roadmap.controller.ts            # Roadmap generation & retrieval
│   ├── lib/
│   │   └── prisma.ts             # PrismaClient singleton, test mock setter & connectivity checker
│   ├── middleware/
│   │   ├── error.middleware.ts     # Centralized error handler
│   │   └── not-found.middleware.ts # Standard 404 JSON response handler
│   ├── routes/
│   │   ├── health.routes.ts      # /api/health and /api/health/ready
│   │   ├── industry.routes.ts    # /api/industry endpoints
│   │   ├── learner.routes.ts     # /api/learners endpoints (+ notifications)
│   │   ├── lesson.routes.ts      # /api/lessons endpoints (+ recommendations)
│   │   ├── quiz.routes.ts        # /api/quizzes endpoints
│   │   ├── roadmap.routes.ts     # /api/roadmaps endpoints (+ updates, versions)
│   │   └── index.ts              # Top-level API router mounted at /api
│   ├── services/
│   │   ├── source-adapters/
│   │   │   ├── safe-fetch.ts                # SSRF validation, size limits & timeouts
│   │   │   ├── source-adapter.interface.ts  # SourceAdapter contract
│   │   │   ├── rss.adapter.ts               # RSS 2.0 & Atom feed parser
│   │   │   ├── official-release.adapter.ts  # GitHub / JSON release parser
│   │   │   └── source-adapter.registry.ts   # Adapter registry
│   │   ├── ai-industry-analysis.service.ts  # AI/heuristic analysis & prompt injection defense
│   │   ├── daily-plan.service.ts            # Deterministic daily learning plan algorithm
│   │   ├── health.service.ts                # Liveness & readiness logic
│   │   ├── industry-monitor.service.ts      # Source scanning & deduplication
│   │   ├── learner.service.ts               # Learner profile operations
│   │   ├── lesson.service.ts                # Lesson content & completion
│   │   ├── notification.service.ts          # In-app notification management
│   │   ├── progress.service.ts              # Aggregate progress metrics
│   │   ├── quiz.service.ts                  # Quiz creation & scoring
│   │   ├── recommendation.service.ts        # YouTube API & curated resources
│   │   ├── roadmap-generator.service.ts     # Deterministic curriculum templates
│   │   ├── roadmap-impact-analyzer.service.ts # Impact scoring & proposal generation
│   │   ├── roadmap-versioning.service.ts    # Version snapshots & atomic update application
│   │   ├── roadmap.service.ts               # Roadmap persistence
│   │   └── skill-catalog.service.ts         # Canonical skill catalog & token matcher
│   ├── validators/
│   │   ├── industry.schema.ts        # Zod validation for sources & update rejection
│   │   ├── learner.schema.ts         # Zod validation for learner payloads
│   │   ├── lesson-progress.schema.ts # Zod validation for lesson completion
│   │   ├── quiz.schema.ts            # Zod validation for quiz payloads
│   │   └── roadmap.schema.ts         # Zod validation for roadmap generation
│   ├── app.ts                    # Express application setup
│   ├── server.ts                 # HTTP server listener & graceful shutdown
│   └── worker.ts                 # Background industry monitor worker process
├── test/
│   ├── health.spec.ts                   # Liveness, readiness, and 404 tests (4 tests)
│   ├── industry-dynamic-roadmap.spec.ts # Part 5 tests: SSRF, monitoring, adaptation, versioning (15 tests)
│   ├── learner-roadmap.spec.ts          # Learner profiles & roadmap tests (18 tests)
│   ├── learning-progress.spec.ts        # Progress & daily plan tests (20 tests)
│   ├── quiz.spec.ts                     # Quiz creation, security & scoring tests (23 tests)
│   └── mock-prisma.ts                   # In-memory transactional Prisma mock
└── package.json
```

---

## 4. Part 5 API Endpoints

All endpoints are prefixed with `/api`.

### 1. Industry Monitoring & Events
- `GET /api/industry/sources`: Lists all configured monitoring sources.
- `POST /api/industry/sources`: Creates a new monitoring source (administrative).
- `PATCH /api/industry/sources/:id`: Updates an existing monitoring source.
- `POST /api/industry/scan`: Triggers a bounded on-demand scan of all active sources.
- `GET /api/industry/events`: Lists detected events (supports `?status=` and `?skill=` filters).
- `GET /api/industry/events/:id`: Retrieves detailed event analysis, affected skills, and proposals.
- `GET /api/industry/status`: Returns administrative monitoring metrics and health.

### 2. Dynamic Roadmaps, Adaptation & Versioning
- `GET /api/roadmaps/:id/updates`: Lists proposed, applied, or rejected updates for a roadmap.
- `POST /api/roadmaps/:id/adapt`: Triggers on-demand impact evaluation of recent events against this roadmap.
- `POST /api/roadmaps/:id/updates/:updateId/approve`: Atomically applies the proposed update, increments the version number, creates a snapshot `RoadmapVersion`, appends new lessons, and notifies the learner.
- `POST /api/roadmaps/:id/updates/:updateId/reject`: Rejects the update with an optional reason without modifying the roadmap.
- `GET /api/roadmaps/:id/versions`: Lists historical versions (`v1.0`, `v2.0`) with summaries and timestamps.
- `GET /api/roadmaps/:id/versions/:versionId`: Retrieves the complete milestone/lesson snapshot of a specific historical version.

### 3. Notifications & Recommendations
- `GET /api/learners/:id/notifications`: Retrieves learner notifications (supports `?unread=true`).
- `PATCH /api/learners/:id/notifications/:notificationId/read`: Marks a notification as read.
- `GET /api/lessons/:id/recommendations`: Returns video tutorial recommendations from YouTube API or verified educational channels.

---

## 5. Available Scripts

| Command | Workspace | Description |
|---|---|---|
| `npm run dev:api` | `apps/api` | Starts API backend server on port 5000 |
| `npm run dev:web` | `apps/web` | Starts Next.js frontend on port 3000 |
| `npm run worker:dev` | `apps/api` | Runs the background industry monitoring worker |
| `npm run worker:start` | `apps/api` | Runs compiled background worker in production mode |
| `npm run test` | `apps/api` | Runs Vitest automated test suite (**80 tests across 5 test suites**) |
| `npm run typecheck` | `apps/api` | Validates TypeScript types (`tsc --noEmit`) |
| `npm run build:api` | `apps/api` | Compiles API backend into `dist/` |
| `npm run build:web` | `apps/web` | Builds Next.js frontend with Turbopack |

---

## 6. Verification Status Summary

| Check | Status | Verification Detail |
|---|---|---|
| Prisma Schema Validation | **VERIFIED** | Validated via `npx prisma validate --schema=apps/api/prisma/schema.prisma` |
| Prisma Client Generation | **VERIFIED** | Generated via `npm run prisma:generate` (Prisma v6.19.3) |
| TypeScript Compilation | **VERIFIED** | `npm run typecheck --workspace=api` passed with 0 errors |
| API Production Build | **VERIFIED** | `npm run build --workspace=api` compiled cleanly into `apps/api/dist/` |
| Web Production Build | **VERIFIED** | `npm run build --workspace=web` compiled cleanly via Next.js Turbopack |
| Automated Tests | **VERIFIED** | **80/80 tests passed** in Vitest across 5 test files |
| SSRF Protection & Safe Fetch | **VERIFIED** | Verified private IP ranges, non-HTTP schemes, timeouts, and size limits |
| Canonical Skill Matching | **VERIFIED** | Verified token & alias matching to canonical skill catalog |
| Deduplication Pipeline | **VERIFIED** | Verified deduplication by contentHash, externalId, and canonicalUrl |
| Atomic Versioning & Preservation | **VERIFIED** | Verified version increment, snapshot preservation, and completed progress retention |
| Daily Plan Integration | **VERIFIED** | Verified approved lessons appear in daily plans while completed work remains intact |
| In-App Notifications | **VERIFIED** | Verified notification creation upon update approval and read state tracking |
| Background Worker Process | **VERIFIED** | Verified isolated worker process entrypoint (`worker:dev` / `worker:start`) |
| PostgreSQL Database Runtime | **PENDING DATABASE RUNTIME** | Local Docker / PostgreSQL daemon at `localhost:5435` is currently stopped; migrations are prepared to apply once started |
