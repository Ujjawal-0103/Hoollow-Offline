# Hoollow API Backend

Backend REST API for **Hoollow**, an AI-powered personalized learning platform.

---

## 1. Project Overview

Hoollow guides learners through their educational journey:
**Plan → Learn → Practice → Track Progress → Revise → Level Up**.

This backend service implements the foundational architecture (Part 1), Learner Profiles & Structured Roadmaps (Part 2), In-App Learning & Progress Tracking (Part 3), and Quiz & Assessment System (Part 4), including:
- HTTP server configuration with TypeScript, Express, and CORS.
- Zod-validated environment variables and centralized error handling.
- Prisma 6 ORM schema with PostgreSQL persistence for Learners, Roadmaps, Milestones, Lessons, LessonProgress, Quizzes, QuizQuestions, QuizAttempts, and QuizResponses.
- Deterministic, template-based curriculum generator for skills (e.g. Web Development).
- Learner-specific lesson completion tracking (idempotent, isolated per learner).
- Real-time progress metric calculations across roadmaps with safe rounding.
- Deterministic daily learning plan recommendations based on learner daily minutes.
- Quiz & Assessment system with:
  - Quiz creation for lessons with atomic transactions, exactly 4 distinct options, valid correct answers, and question ordering.
  - Pre-submission security ensuring secret answers and explanations are never leaked.
  - Server-calculated score evaluation with atomic attempt/response recording.
  - Learner attempt history ordered newest first with lesson and roadmap context.
  - Aggregate performance statistics with safe handling of learners with 0 attempts.
- Automated tests with Vitest and Supertest (**65 automated tests across 4 test suites**).

---

## 2. Technology Stack

- **Runtime:** Node.js (v22+ LTS)
- **Language:** TypeScript 5.7+ (strict mode enabled)
- **Framework:** Express.js 4.21+
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
│   └── schema.prisma             # PostgreSQL schema (Learner, Roadmap, Milestone, Lesson, LessonProgress, Quiz, QuizQuestion, QuizAttempt, QuizResponse)
├── src/
│   ├── config/
│   │   └── env.ts                # Zod-validated environment schema & parser
│   ├── controllers/
│   │   ├── daily-plan.controller.ts # Daily learning plan recommendations
│   │   ├── health.controller.ts     # Health & readiness probes
│   │   ├── learner.controller.ts    # Learner creation, retrieval & preference updates
│   │   ├── lesson.controller.ts     # Lesson retrieval, roadmap lesson listing, completion & lesson quizzes
│   │   ├── progress.controller.ts   # Learner progress summary metrics
│   │   ├── quiz.controller.ts       # Quiz creation, retrieval, submission & learner attempt/performance
│   │   └── roadmap.controller.ts    # Roadmap generation, retrieval & learner roadmap listing
│   ├── lib/
│   │   └── prisma.ts             # PrismaClient singleton, test mock setter & connectivity checker
│   ├── middleware/
│   │   ├── error.middleware.ts     # Centralized error handler (sanitizes stack traces in prod)
│   │   └── not-found.middleware.ts # Standard 404 JSON response handler
│   ├── routes/
│   │   ├── health.routes.ts      # /api/health and /api/health/ready
│   │   ├── learner.routes.ts     # /api/learners endpoints (+ progress, daily-plan, quiz-attempts, quiz-performance)
│   │   ├── lesson.routes.ts      # /api/lessons endpoints (+ complete, quiz)
│   │   ├── quiz.routes.ts        # /api/quizzes endpoints (create, get, submit)
│   │   ├── roadmap.routes.ts     # /api/roadmaps endpoints (+ lessons)
│   │   └── index.ts              # Top-level API router mounted at /api
│   ├── services/
│   │   ├── daily-plan.service.ts        # Deterministic daily learning plan algorithm
│   │   ├── health.service.ts            # Liveness & readiness logic
│   │   ├── learner.service.ts           # Learner profile data operations
│   │   ├── lesson.service.ts            # Lesson content, roadmap lessons & idempotent completion
│   │   ├── progress.service.ts          # Aggregate progress metrics & rounding
│   │   ├── quiz.service.ts              # Quiz creation, pre-submission sanitization, server scoring & performance
│   │   ├── roadmap.service.ts           # Atomic roadmap creation & retrieval logic
│   │   └── roadmap-generator.service.ts # Deterministic curriculum template generator
│   ├── validators/
│   │   ├── learner.schema.ts         # Zod validation for learner payloads & preferences
│   │   ├── lesson-progress.schema.ts # Zod validation for lesson completion payloads
│   │   ├── quiz.schema.ts            # Zod validation for quiz creation & submission payloads
│   │   └── roadmap.schema.ts         # Zod validation for roadmap generation payloads
│   ├── app.ts                    # Express application setup, CORS, JSON parser, routes
│   └── server.ts                 # HTTP server listener & graceful shutdown handling
├── test/
│   ├── health.spec.ts            # Liveness, readiness, and 404 tests (4 tests)
│   ├── learner-roadmap.spec.ts   # Learner profiles & roadmap tests (18 tests)
│   ├── learning-progress.spec.ts # In-app learning, progress, and daily plan tests (20 tests)
│   ├── quiz.spec.ts              # Quiz creation, security, submission, scoring & performance tests (23 tests)
│   └── mock-prisma.ts            # In-memory transactional Prisma mock for isolated database testing
├── .env.example                  # Configuration template
├── .env                          # Local environment file (ignored in git)
├── .gitignore                    # Excludes node_modules, dist, .env, coverage
├── package.json                  # Scripts and dependencies
├── tsconfig.json                 # Strict TypeScript configuration emitting to dist/
├── vitest.config.ts              # Vitest test runner configuration
└── README.md                     # This documentation
```

---

## 4. Database Models

The Prisma schema defines the core learning domain models:

### 1. `Learner`
- `id`: String (UUID, primary key)
- `displayName`: String
- `preferredLanguage`: String (default: 'English')
- `currentLevel`: LearnerLevel enum (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
- `learningGoal`: String
- `minutesPerDay`: Int (default: 30)
- `createdAt` / `updatedAt`: DateTime
- Relations: `roadmaps` (Roadmap[]), `lessonProgress` (LessonProgress[]), `quizAttempts` (QuizAttempt[])

### 2. `Roadmap`
- `id`: String (UUID, primary key)
- `learnerId`: String (foreign key referencing `Learner.id`)
- `title`: String
- `skill`: String
- `createdAt` / `updatedAt`: DateTime
- Relations: `learner` (Learner), `milestones` (Milestone[])

### 3. `Milestone`
- `id`: String (UUID, primary key)
- `roadmapId`: String (foreign key referencing `Roadmap.id`)
- `title`: String
- `description`: String (optional)
- `order`: Int (1-indexed order within roadmap)
- `estimatedDurationMinutes`: Int
- `createdAt` / `updatedAt`: DateTime
- Relations: `roadmap` (Roadmap), `lessons` (Lesson[])
- Constraints: `@@unique([roadmapId, order])`

### 4. `Lesson`
- `id`: String (UUID, primary key)
- `milestoneId`: String (foreign key referencing `Milestone.id`)
- `title`: String
- `description`: String (optional)
- `order`: Int (1-indexed order within milestone)
- `durationMinutes`: Int
- `learningObjectives`: String[] (array of objectives)
- `content`: Text (comprehensive lesson explanation)
- `examples`: String[] (code snippets or practical examples)
- `keyTakeaways`: String[] (bulleted review takeaways)
- `createdAt` / `updatedAt`: DateTime
- Relations: `milestone` (Milestone), `progress` (LessonProgress[]), `quizzes` (Quiz[])
- Constraints: `@@unique([milestoneId, order])`

### 5. `LessonProgress`
- `id`: String (UUID, primary key)
- `learnerId`: String (foreign key referencing `Learner.id`)
- `lessonId`: String (foreign key referencing `Lesson.id`)
- `completed`: Boolean (default: true)
- `completedAt`: DateTime? (timestamp when lesson was completed)
- `createdAt` / `updatedAt`: DateTime
- Relations: `learner` (Learner), `lesson` (Lesson)
- Constraints: `@@unique([learnerId, lessonId])` (enforces one progress entry per learner/lesson pair)

### 6. `Quiz`
- `id`: String (UUID, primary key)
- `lessonId`: String (foreign key referencing `Lesson.id`, cascade delete)
- `title`: String
- `description`: String? (optional summary of quiz)
- `createdAt` / `updatedAt`: DateTime
- Relations: `lesson` (Lesson), `questions` (QuizQuestion[]), `attempts` (QuizAttempt[])
- Indexes: `@@index([lessonId])`

### 7. `QuizQuestion`
- `id`: String (UUID, primary key)
- `quizId`: String (foreign key referencing `Quiz.id`, cascade delete)
- `question`: String (non-empty question prompt)
- `options`: String[] (array of exactly 4 distinct options)
- `correctAnswer`: String (must match one of the 4 options)
- `explanation`: String (pedagogical explanation for the answer)
- `order`: Int (1-indexed display order)
- `createdAt` / `updatedAt`: DateTime
- Relations: `quiz` (Quiz), `responses` (QuizResponse[])
- Constraints: `@@unique([quizId, order])`, `@@index([quizId])`

### 8. `QuizAttempt`
- `id`: String (UUID, primary key)
- `learnerId`: String (foreign key referencing `Learner.id`, cascade delete)
- `quizId`: String (foreign key referencing `Quiz.id`, cascade delete)
- `score`: Int (calculated percentage score, 0 to 100)
- `totalQuestions`: Int (total questions in quiz at time of attempt)
- `correctAnswers`: Int (number of correct answers submitted)
- `submittedAt`: DateTime (submission timestamp, default `now()`)
- `createdAt` / `updatedAt`: DateTime
- Relations: `learner` (Learner), `quiz` (Quiz), `responses` (QuizResponse[])
- Indexes: `@@index([learnerId])`, `@@index([quizId])`, `@@index([submittedAt])`

### 9. `QuizResponse`
- `id`: String (UUID, primary key)
- `attemptId`: String (foreign key referencing `QuizAttempt.id`, cascade delete)
- `questionId`: String (foreign key referencing `QuizQuestion.id`, cascade delete)
- `selectedAnswer`: String (the option selected by the learner)
- `isCorrect`: Boolean (whether the selected option matches `correctAnswer`)
- `createdAt`: DateTime
- Relations: `attempt` (QuizAttempt), `question` (QuizQuestion)
- Constraints: `@@unique([attemptId, questionId])` (prevents duplicate responses in one attempt), `@@index([attemptId])`

---

## 5. API Endpoints

All endpoints are prefixed with `/api`.

### 1. Quiz & Assessment Endpoints (Part 4)

#### POST `/api/quizzes`
Creates a quiz and its questions for an existing lesson.
- Validates that target lesson exists.
- Enforces non-empty title and question text.
- Enforces exactly 4 distinct answer options per question.
- Validates that `correctAnswer` matches one of the 4 options.
- Atomically persists the quiz and its questions in a Prisma transaction.

**Request Body:**
```json
{
  "lessonId": "lesson-uuid",
  "title": "TypeScript Fundamentals Quiz",
  "description": "Assess basic TypeScript syntax and type declarations",
  "questions": [
    {
      "question": "What is TypeScript?",
      "options": [
        "A typed superset of JavaScript",
        "A CSS styling engine",
        "A database query tool",
        "An operating system kernel"
      ],
      "correctAnswer": "A typed superset of JavaScript",
      "explanation": "TypeScript compiles to standard JavaScript and adds static typing.",
      "order": 1
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "quiz-uuid",
    "lessonId": "lesson-uuid",
    "title": "TypeScript Fundamentals Quiz",
    "description": "Assess basic TypeScript syntax and type declarations",
    "questions": [ ... ]
  }
}
```

---

#### GET `/api/lessons/:id/quiz`
Returns all quizzes associated with a lesson with questions in display order.
> [!IMPORTANT]
> **Pre-submission Security Requirement:** `correctAnswer`, `explanation`, and `isCorrect` are strictly excluded from question objects returned by this endpoint.

---

#### GET `/api/quizzes/:id`
Returns quiz metadata and questions in ascending display order.
> [!IMPORTANT]
> **Pre-submission Security Requirement:** `correctAnswer`, `explanation`, and `isCorrect` are strictly excluded from question objects returned by this endpoint.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "quiz-uuid",
    "lessonId": "lesson-uuid",
    "title": "TypeScript Fundamentals Quiz",
    "description": "Assess basic TypeScript syntax and type declarations",
    "questions": [
      {
        "id": "question-uuid",
        "quizId": "quiz-uuid",
        "question": "What is TypeScript?",
        "options": [
          "A typed superset of JavaScript",
          "A CSS styling engine",
          "A database query tool",
          "An operating system kernel"
        ],
        "order": 1
      }
    ]
  }
}
```

---

#### POST `/api/quizzes/:id/submit`
Accepts a learner's submitted answers, computes correctness and score on the server, and atomically stores the attempt and responses.
- Accepts answers as an array `[{ questionId, selectedAnswer }]` or as an object map `{ [questionId]: selectedAnswer }`.
- Validates learner and quiz exist.
- Validates all question IDs belong to the specified quiz.
- Validates no duplicate answers for the same question.
- Validates each selected answer is one of the question's four options.
- Unanswered questions in the quiz count as incorrect.
- Percentage score is calculated on the server: `Math.round((correct / total) * 100)`.

**Request Body:**
```json
{
  "learnerId": "learner-uuid",
  "answers": [
    {
      "questionId": "question-1-uuid",
      "selectedAnswer": "A typed superset of JavaScript"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": "attempt-uuid",
    "quizId": "quiz-uuid",
    "learnerId": "learner-uuid",
    "score": 100,
    "percentageScore": 100,
    "totalQuestions": 1,
    "correctAnswers": 1,
    "submittedAt": "2026-10-24T12:00:00.000Z",
    "review": [
      {
        "questionId": "question-1-uuid",
        "question": "What is TypeScript?",
        "options": [
          "A typed superset of JavaScript",
          "A CSS styling engine",
          "A database query tool",
          "An operating system kernel"
        ],
        "selectedAnswer": "A typed superset of JavaScript",
        "correctAnswer": "A typed superset of JavaScript",
        "isCorrect": true,
        "explanation": "TypeScript compiles to standard JavaScript and adds static typing."
      }
    ]
  }
}
```

---

#### GET `/api/learners/:id/quiz-attempts`
Returns the learner's complete attempt history ordered newest first (`submittedAt: 'desc'`), including quiz title, lesson ID, lesson title, score, and submission timestamp.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "attempt-uuid",
      "quizId": "quiz-uuid",
      "quizTitle": "TypeScript Fundamentals Quiz",
      "lessonId": "lesson-uuid",
      "lessonTitle": "Web Architecture & HTML5 Document Structure",
      "score": 100,
      "totalQuestions": 1,
      "correctAnswers": 1,
      "submittedAt": "2026-10-24T12:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/learners/:id/quiz-performance`
Returns aggregated quiz statistics for a learner:
- `totalAttempts`: Total number of submissions.
- `uniqueQuizzesAttempted`: Count of distinct quizzes attempted.
- `averageScore` / `averagePercentageScore`: Rounded average across all attempts.
- `latestAttempt`: Most recent submission object, or `null`.
- `quizScores`: Per-quiz best score and attempt count.
- Handled safely when a learner has 0 attempts (`averageScore: 0`, `latestAttempt: null`, `quizScores: []`).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "learnerId": "learner-uuid",
    "totalAttempts": 2,
    "uniqueQuizzesAttempted": 1,
    "averageScore": 75,
    "averagePercentageScore": 75,
    "latestAttempt": {
      "id": "attempt-uuid",
      "quizId": "quiz-uuid",
      "quizTitle": "TypeScript Fundamentals Quiz",
      "lessonId": "lesson-uuid",
      "lessonTitle": "Web Architecture & HTML5 Document Structure",
      "score": 100,
      "totalQuestions": 1,
      "correctAnswers": 1,
      "submittedAt": "2026-10-24T12:05:00.000Z"
    },
    "quizScores": [
      {
        "quizId": "quiz-uuid",
        "quizTitle": "TypeScript Fundamentals Quiz",
        "bestScore": 100,
        "latestScore": 100,
        "attemptsCount": 2
      }
    ]
  }
}
```

> [!NOTE]
> **Authentication & Authorization Note:** The current system relies on explicit `learnerId` inputs without authentication. When authentication is implemented in a future milestone, learner identity will be derived from authenticated session tokens and authorization guards will prevent cross-learner access.

---

### 2. In-App Learning & Lessons Endpoints (Part 3)

| Method | Path | Status Codes | Description |
|---|---|---|---|
| `GET` | `/api/roadmaps/:id/lessons` | `200`, `404` | Returns ordered lessons for a roadmap (supports `?learnerId=`) |
| `GET` | `/api/lessons/:id` | `200`, `404` | Returns complete lesson content with milestone & roadmap |
| `POST` | `/api/lessons/:id/complete` | `200`, `400`, `404` | Idempotently marks a lesson completed for a learner |
| `GET` | `/api/learners/:id/progress` | `200`, `404` | Returns aggregate roadmap progress metrics & percentages |
| `GET` | `/api/learners/:id/daily-plan` | `200`, `404` | Generates deterministic daily learning recommendations |

---

### 3. Learner Profile & Roadmap Endpoints (Part 2)

| Method | Path | Status Codes | Description |
|---|---|---|---|
| `POST` | `/api/learners` | `201`, `400` | Creates a new learner profile |
| `GET` | `/api/learners/:id` | `200`, `404` | Retrieves learner profile by ID |
| `PATCH` | `/api/learners/:id/preferences` | `200`, `400`, `404` | Updates learner preferences |
| `GET` | `/api/learners/:id/roadmaps` | `200`, `404` | Lists all roadmaps for a learner |
| `POST` | `/api/roadmaps` | `201`, `400`, `404` | Generates & atomically saves structured roadmap |
| `GET` | `/api/roadmaps/:id` | `200`, `404` | Retrieves roadmap with ordered milestones & lessons |

---

### 4. System Health Endpoints (Part 1)

| Method | Path | Status Codes | Description |
|---|---|---|---|
| `GET` | `/api/health` | `200` | Process liveness probe |
| `GET` | `/api/health/ready` | `200`, `503` | Readiness probe (verifies database connectivity) |

---

## 6. Available Scripts

| Script | Root Command | Inside `apps/api` | Description |
|---|---|---|---|
| Development | `npm run dev` | `npm run dev` | Starts server with `tsx watch` for auto-reloading |
| Typecheck | `npm run typecheck` | `npm run typecheck` | Validates TypeScript types (`tsc --noEmit`) |
| Build | `npm run build` | `npm run build` | Compiles TypeScript into `dist/` |
| Production Start | `npm run start` | `npm run start` | Runs compiled `dist/server.js` |
| Test | `npm run test` | `npm run test` | Executes Vitest automated test suite (**65 tests**) |
| Prisma Validate | `npx prisma validate` | `npx prisma validate` | Validates `schema.prisma` syntax and relations |
| Prisma Generate | `npm run prisma:generate` | `npm run prisma:generate` | Generates typed Prisma client (v6.19.3) |

---

## 7. Verification Status Summary

| Check | Status | Verification Detail |
|---|---|---|
| Prisma Schema Validation | **VERIFIED** | Validated successfully via `npx prisma validate --schema=apps/api/prisma/schema.prisma` |
| Prisma Client Generation | **VERIFIED** | Generated successfully via `npm run prisma:generate` (Prisma v6.19.3) |
| TypeScript Compilation | **VERIFIED** | `npm run typecheck` passed with 0 errors (`tsc --noEmit`) |
| Production Build | **VERIFIED** | `npm run build` compiled cleanly into `apps/api/dist/` |
| Automated Tests | **VERIFIED** | **65/65 tests passed** in Vitest across 4 test suites: `health.spec.ts` (4), `learner-roadmap.spec.ts` (18), `learning-progress.spec.ts` (20), `quiz.spec.ts` (23) |
| Quiz Creation & 4-Option Validation | **VERIFIED** | Verified 4 distinct options, valid correct answer, display order, limit, transaction |
| Pre-submission Security | **VERIFIED** | Verified `correctAnswer`, `explanation`, and `isCorrect` are NEVER leaked prior to submission |
| Server Scoring & Submission | **VERIFIED** | Verified server calculates score, unanswered questions count as incorrect, atomic transaction |
| Attempt History & Ordering | **VERIFIED** | Verified repeated attempts recorded, ordered newest first with lesson & quiz context |
| Aggregate Performance | **VERIFIED** | Verified total attempts, unique quizzes, average score, latest attempt, per-quiz best score; safe 0-attempt handling |
| Parts 1–3 Preservation | **VERIFIED** | All previous 42 tests for health, learner, roadmap, lessons, completion, progress, and daily plan pass intact |
| PostgreSQL Persistence | **PENDING DATABASE RUNTIME** | Local PostgreSQL instance at `localhost:5435` is currently stopped; schema and migrations are ready to apply once container starts |
