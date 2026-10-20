# Team Collaboration Workflow (4-Member Team)

This workflow is optimized for a **4–5 hour hackathon**. It minimizes overhead, eliminates git merge conflicts, and ensures high velocity between receiving the problem statement and delivering the working demo.

---

## 1. Team Roles & Responsibilities

| Role | Primary Focus | Key File Ownership |
|------|---------------|-------------------|
| **Member 1: Frontend Lead** | UI screens, interactive forms, responsive layout, API client | `apps/web/app/`, `apps/web/components/`, `apps/web/lib/` |
| **Member 2: Backend Lead** | REST controllers, service logic, DTOs, ValidationPipe | `apps/api/src/modules/`, `apps/api/src/common/` |
| **Member 3: Database & DevOps** | Prisma schema, migrations, seed data, Docker Compose, deployment | `docker-compose.yml`, `prisma/`, `scripts/` |
| **Member 4: Integrator / QA / Pitch** | End-to-end testing, demo scripting, UI polish, edge cases | Integration test scripts, demo flows, presentation deck |

---

## 2. Minute 0 to 30: Kickoff & Contract Freeze

1. **Problem Statement Analysis (10 min):**
   - Read the problem statement together as a team.
   - Agree on **1 core user journey** to win the judging rubric. Do not attempt a multi-role complex system.
2. **API Contract Agreement (15 min):**
   - Open [docs/api-contract-template.md](api-contract-template.md).
   - Write out the 3–5 core endpoints (URLs, request JSON, response JSON).
   - Once agreed, freeze the contract. Frontend and Backend can now develop 100% in parallel using mock data without waiting for each other.

---

## 3. Git Branching & Collaboration Guidelines

### Branch Naming Convention
Branches must be short-lived and tied to a single developer's scope:
- `feature/web-<feature-name>` (e.g. `feature/web-form`, `feature/web-dashboard`)
- `feature/api-<feature-name>` (e.g. `feature/api-submit`, `feature/api-auth`)
- `feature/db-<feature-name>`  (e.g. `feature/db-schema`, `feature/db-seeds`)
- `fix/<issue-name>`           (e.g. `fix/cors-header`, `fix/port-binding`)

### Step-by-Step Git Commands

#### Starting a Feature Branch
```powershell
# Always branch off the latest main
git checkout main
git pull origin main
git checkout -b feature/web-hero-ui
```

#### Making Commits
Write small, logical commits frequently:
```powershell
git status
git add apps/web/app/page.tsx
git commit -m "feat(web): add initial hero section with API status ping"
```

#### Pushing and Opening a Pull Request
```powershell
git push -u origin feature/web-hero-ui
```
- Open a PR into `main`.
- In a 5-hour hackathon, PR reviews must be fast: have your integration partner (e.g. Backend Lead checks Frontend PR or vice versa) do a 60-second review and click **Merge (Squash and Merge)**.

---

## 4. Conflict Avoidance Strategies

Merge conflicts burn valuable hackathon time. Follow these rules:

1. **Strict Directory Isolation:**
   - Frontend Lead edits only `apps/web/`.
   - Backend Lead edits only `apps/api/`.
   - Database Lead edits only `prisma/` and `docker-compose.yml`.
   - Never let two developers edit the same file simultaneously.
2. **Pull Main Frequently:**
   Before starting any new component or module, sync with `main`:
   ```powershell
   git checkout main
   git pull origin main
   git checkout <your-branch>
   git merge main
   ```
3. **Keep `main` Stable:**
   `main` must always build and run. Never merge broken TypeScript or failing linters into `main`.

---

## 5. Working with npm Workspaces

Once venue scaffolding is executed and `workspaces: ["apps/*", "packages/*"]` is active, run commands using npm workspace flags:

```powershell
# Run development server for web frontend
npm run dev --workspace=apps/web

# Run backend development server
npm run start:dev --workspace=apps/api

# Run build on a specific workspace
npm run build --workspace=apps/web

# Add a dependency to a specific workspace
npm install axios --workspace=apps/web
```

> **Dependency Coordination Rule:**
> Always coordinate before adding new npm packages. Because `package-lock.json` is shared across the repository, avoid having multiple team members install dependencies on separate branches simultaneously. If a new library is needed, install it on `main` or merge it immediately so teammates can run `npm install` and stay in sync.

---

## 6. Resolving Merge Conflicts Fast

If Git reports a conflict during `git merge main`:

1. Check conflicting files:
   ```powershell
   git status
   ```
2. Open the conflicting file in your editor (look for `<<<<<<< HEAD`, `=======`, `>>>>>>> main`).
3. If the conflict is in `package.json` or `package-lock.json`:
   - Keep both added packages in `package.json`.
   - Re-run `npm install` to let npm rebuild `package-lock.json` cleanly.
4. Stage and finish merge:
   ```powershell
   git add <resolved-file> package-lock.json
   git commit -m "chore: resolve merge conflict with main"
   git push origin <your-branch>
   ```

---

## 7. Recovery from Accidental Local Changes

If you made changes that broke your local branch and you need to restore or discard them without losing work:

### Case A: Discard uncommitted changes to a specific file
```powershell
git restore path/to/file.tsx
```

### Case B: Temporarily save unfinished work to switch branches
```powershell
# Stash your current work
git stash push -m "WIP work on form"

# Switch branches, pull or fix
git checkout main
git pull origin main

# Return to your branch and restore your work
git checkout feature/web-hero-ui
git stash pop
```

### Case C: Discard all uncommitted experiments and revert to clean branch
```powershell
# CAUTION: This resets tracked files to last commit
git restore .
git clean -fd  # removes untracked scratch files
```
