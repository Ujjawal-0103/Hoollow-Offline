# Hoollow — Parallel Development Workflow

## Purpose

Phase 1 is already in progress. This workflow defines the remaining work so **four team members can work at the same time**: two on the frontend and two on the backend.

The key design rule is that each upcoming workstream must be independently buildable. A team member should not need another workstream to be finished before they can implement or test their own module. Shared dependencies are limited to agreed data contracts, common UI/API conventions, and the initial project setup.

This document describes phase ownership, boundaries, handoffs, and completion criteria. Detailed feature requirements and implementation instructions should live in separate documents.

---

## 1. Team split

| Owner | Track | Responsibility |
|---|---|---|
| Frontend A | Core Learning UI | Onboarding, roadmap, dashboard, lessons, progress |
| Frontend B | Engagement & AI UI | Authentication screens, practice, gamification, revision, AI tutor, video discovery |
| Backend A | Core Learning APIs | Learner profile, preferences, roadmap, lesson, daily plan, progress |
| Backend B | Engagement & Integration APIs | Authentication, quizzes, rewards, revision, AI tutor, video recommendations |

Each owner should work in a separate module or folder and use agreed interfaces. If the existing project has a different folder structure, preserve it and agree on module boundaries before editing shared files.

### Shared ownership
- Both frontend developers agree on UI components, routing, styling tokens, and frontend types.
- Both backend developers agree on API response/error formats, database conventions, environment variables, and validation patterns.
- The frontend and backend tracks agree on API contracts before live integration.
- Only one person should own shared configuration files at a time to avoid conflicting edits.

---

## 2. Independence rules

To keep all four people productive in parallel:

1. **Use contracts first.** Define request/response types and route names before implementing connected modules.
2. **Build with fixtures.** Each module should have a small, clearly labeled set of local mock/fixture data so it can run and be tested independently.
3. **Avoid cross-module imports.** A module should depend on shared types/utilities, not on another unfinished feature's internal implementation.
4. **Use stable identifiers.** Treat IDs as opaque strings; do not assume IDs are numeric.
5. **Make integrations replaceable.** Frontend mock services should have the same interface as real API services.
6. **Keep optional services optional.** AI and YouTube modules must work in a clear demo/error state when credentials are unavailable.
7. **Agree before changing contracts.** Any breaking route or response change must be shared with all affected owners.
8. **Integrate incrementally.** Modules are considered independent when they can be built/tested with fixtures; connect them once both sides are ready.

---

## 3. Shared conventions

### API base URL
Use the existing project convention. If none exists, use:
- Local backend API: `http://localhost:5000/api`
- Frontend environment variable: `VITE_API_BASE_URL=http://localhost:5000/api`

### Response format
Success:
```json
{
  "success": true,
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A readable error message"
  }
}
```

Use suitable HTTP status codes. Do not expose secrets, stack traces, or internal provider errors to the frontend.

### Mock and integration behavior
- Frontend modules can use fixtures until the matching endpoint is ready.
- Keep fixtures behind service functions, not embedded throughout page components.
- Backend modules should be testable using seeded development fixtures or isolated service tests.
- Clearly label demo data. Never present fabricated YouTube results or AI output as live results.

### Shared data-contract checklist
For every endpoint, document:
- Method and path
- Request body and query parameters
- Success response
- Error response
- Persistence behavior
- Authentication requirement, if any

---

## 4. Phase 1 — Project Setup & Authentication (already running)

Phase 1 is underway. Finish and stabilize the shared application foundation without blocking other teams on feature work.

### Frontend baseline
- App shell, routing, theme, shared UI components
- Register and login screens or placeholders
- API client configuration

### Backend baseline
- Server and environment setup
- Health endpoint
- Database/ORM configuration
- Shared error and response conventions

### Exit criteria
- Both frontend and backend can run locally.
- Shared folders and ownership are agreed.
- API base URL and response/error conventions are documented.
- Remaining work can proceed in separate modules.

---

## 5. Independent workstreams for the remaining phases

The following workstreams can begin concurrently after agreeing on shared conventions. Their phase numbers are planning labels, not a strict sequence.

## Workstream A — Onboarding & Roadmap

**Frontend owner: Frontend A**
- Build onboarding flow for skill, current level, learning goal, daily available time, and language.
- Build roadmap list/detail screens and milestone presentation.
- Use local fixtures and a service interface so the screens work without backend availability.
- Provide loading, empty, and error states.

**Backend owner: Backend A**
- Implement learner profile and learning-preference operations.
- Implement roadmap creation/retrieval and milestone/lesson ordering.
- Use a template-based fallback if AI roadmap generation is not configured.
- Add validation and isolated tests.

**Suggested API boundary**
- `POST /api/learners`
- `GET /api/learners/:id`
- `PATCH /api/learners/:id/preferences`
- `POST /api/roadmaps`
- `GET /api/roadmaps/:id`
- `GET /api/learners/:id/roadmaps`

**Independent completion criteria**
- Frontend can demonstrate onboarding and roadmap screens with fixtures.
- Backend can create and retrieve a learner and roadmap through API tests.
- Both use the same agreed field names and identifiers.

---

## Workstream B — Dashboard, Lessons & Progress

**Frontend owner: Frontend A**
- Build dashboard cards and the daily plan layout.
- Build lesson reader and lesson completion interaction.
- Build progress summaries and next-action presentation.
- Use local fixture data and mocked service responses.

**Backend owner: Backend A**
- Implement lesson retrieval and completion.
- Implement daily-plan and progress-summary operations.
- Calculate progress from persisted completion state.
- Ensure repeated completion requests do not corrupt progress.

**Suggested API boundary**
- `GET /api/learners/:id/daily-plan`
- `GET /api/roadmaps/:id/lessons`
- `GET /api/lessons/:id`
- `POST /api/lessons/:id/complete`
- `GET /api/learners/:id/progress`

**Independence rule**
Dashboard and lesson UI must render with fixtures even if the roadmap API is not ready. Backend tests should use known fixture records rather than requiring the UI to be complete.

**Independent completion criteria**
- Frontend screens work in mock mode.
- Backend lesson and progress operations pass isolated tests.
- Once connected, completing a lesson and re-fetching progress shows the persisted result.

---

## Workstream C — Authentication & Learner Access

**Frontend owner: Frontend B**
- Build register and login forms.
- Build validation and user-friendly error states.
- Add signed-in/signed-out UI states and route guards according to the agreed auth design.
- Use a mock authentication adapter until backend auth is ready.

**Backend owner: Backend B**
- Implement registration, login, logout/session handling, and the selected authentication mechanism.
- Validate credentials and protect learner-specific endpoints as agreed.
- Store passwords securely using an appropriate password-hashing library if password-based authentication is selected.
- Never store plain-text passwords or return secrets in API responses.

**Suggested API boundary**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Independent completion criteria**
- Frontend authentication screens work with a mock adapter.
- Backend auth flows pass API tests independently.
- The team agrees how the authenticated learner ID is associated with learner/roadmap data before connecting auth to other modules.

---

## Workstream D — Practice, Gamification & Revision

**Frontend owner: Frontend B**
- Build quiz-taking and results screens.
- Build XP, level, badge, and streak displays.
- Build weak-topic/revision screens.
- Keep each screen usable with fixture data and handle empty states.

**Backend owner: Backend B**
- Implement quiz retrieval and server-side answer validation/scoring.
- Persist quiz attempts and incorrect-topic records.
- Implement XP/achievement/streak summaries if time allows.
- Ensure rewards are idempotent and cannot be repeatedly claimed by resubmitting the same action.
- Implement revision recommendations from recorded mistakes.

**Suggested API boundary**
- `GET /api/lessons/:id/quiz`
- `POST /api/quizzes/:id/submit`
- `GET /api/learners/:id/achievements`
- `GET /api/learners/:id/streak`
- `GET /api/learners/:id/revision`

**Independence rule**
Quiz and rewards screens should not require the lesson viewer to be complete; use a fixed lesson/quiz fixture during independent development. Backend quiz tests should not depend on frontend state.

**Independent completion criteria**
- Frontend can complete a fixture-based quiz and show a results screen.
- Backend returns a server-calculated result for a known test submission.
- Rewards and revision data are returned from backend services when implemented.

---

## Workstream E — AI Tutor & Video Discovery

**Frontend owner: Frontend B**
- Build chat UI, message history, suggested prompts, sending/loading/error states.
- Build video cards and topic/language/duration filters.
- Use service adapters with clearly labeled demo responses/results.
- Keep AI chat and video discovery as separate UI modules so one can be tested without the other.

**Backend owner: Backend B**
- Implement `POST /api/ai/chat` using one configured AI provider.
- Implement `GET /api/videos/recommendations` using the official YouTube Data API when configured.
- Validate inputs, apply supported filters, and handle timeouts, missing credentials, rate limits, and provider errors.
- Keep API keys on the server.
- Do not claim a video transcript was analyzed unless transcript or notes were actually supplied to the model.

**Suggested API boundary**
- `POST /api/ai/chat`
- `GET /api/videos/recommendations?topic=...&language=...&duration=...`

**Independence rule**
AI tutor and video discovery must not import each other's code or require each other's credentials. Each module should have its own service, tests, and fallback behavior.

**Independent completion criteria**
- Frontend chat and video screens work in demo mode.
- Backend modules can be tested independently with provider adapters mocked.
- Real API mode works when credentials are configured; otherwise the UI reports a clear unavailable/demo state.

---

## 6. Suggested assignment for all four members

| Member | Primary ownership | Secondary support |
|---|---|---|
| Frontend A | Onboarding, roadmap, dashboard, lessons, progress | Shared layout and frontend types |
| Frontend B | Register/login, practice, gamification, revision, AI tutor, videos | Shared API client and integration |
| Backend A | Learner profiles, preferences, roadmaps, lessons, daily plan, progress | Database models and common validation |
| Backend B | Authentication, quizzes, rewards, revision, AI tutor, video recommendations | Common errors, auth integration, testing |

**Note:** Backend A and Backend B should coordinate database schema changes. Keep models and migrations in one shared schema, and avoid having both people edit the same schema or migration at the same time. Agree on the model interfaces first, then assign one person to apply shared schema changes.

---

## 7. Integration checkpoints

Integration should happen feature by feature, not only at the end.

### Checkpoint 1 — Foundation
- Frontend and backend run independently.
- Health endpoint can be reached from the frontend.
- Shared response conventions are in place.

### Checkpoint 2 — Core learning
- Onboarding and roadmap connect.
- Lesson pages retrieve lesson data.
- Lesson completion updates persisted progress.

### Checkpoint 3 — Engagement
- Auth flow is connected to the agreed learner identity.
- Quiz submissions return server-calculated results.
- Rewards and revision display backend data when available.

### Checkpoint 4 — Learning tools
- Video search and filters work when YouTube is configured.
- AI tutor responds when the AI provider is configured.
- Missing credentials and provider failures produce understandable states.

### Checkpoint 5 — Final demo
- Test the main journey from registration/onboarding to roadmap, lesson, practice, and progress.
- Test AI and video integrations separately.
- Verify responsive UI, errors, and persisted state.
- Clearly label any feature still using demo data.

---

## 8. Team working agreement

- Work in separate feature modules and avoid simultaneous edits to shared files.
- Open a small pull request or communicate the file changes before merging, if using Git.
- Do not change API contracts without notifying the other owners.
- Commit working increments rather than one large final change.
- Keep mock data replaceable and clearly identified.
- Record blockers with the exact file, endpoint, or error.
- Treat optional external integrations as independently testable modules.
- Prioritize a complete core learning journey over polishing every optional feature.

## Definition of success

All four members can develop and test their assigned modules independently using shared contracts and fixtures, then connect them through incremental integration. The result should be one coherent Hoollow application rather than four tightly coupled tasks that must all finish before any testing can begin.
