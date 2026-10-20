# Hackathon Preparation Rules & Mode Assessment

## Assessment Summary

- **Current Preparation Mode:** `STRICT_FROM_SCRATCH`
- **Assessment Date:** Local inspection completed
- **Evaluation Criteria:** Rule #1 of Technical Lead Directives:
  > *"Before making changes, inspect the repository for any available hackathon rules, instructions, or documentation explaining what preparation is permitted... STRICT_FROM_SCRATCH: The organizers require application development to begin at the venue, or their rules are unavailable or unclear... If the rules are unavailable, do not assume starter code is allowed."*

## Why `STRICT_FROM_SCRATCH` Was Selected

1. **Repository State Inspection:** The workspace was initialized with an empty Git repository (`main` branch, no prior commits or documentation).
2. **Rule Availability:** No formal rulebook, event guideline PDF, or organizer announcement was present in the repository explicitly granting permission to pre-scaffold application code or boilerplate.
3. **Compliance Safety:** To guarantee that the team cannot be disqualified or penalized for pre-development, no pre-built application logic, domain-specific routes, pre-generated frameworks, or database entities have been written prior to the hackathon kickoff.

## Permitted Preparation Implemented

Under `STRICT_FROM_SCRATCH`, all preparatory work is strictly confined to developer environment reliability, hygiene, and venue enablement:

- [x] **Repository Hygiene:** `.gitignore`, `.gitattributes`, `.editorconfig`.
- [x] **Git Configuration & Collaboration Guide:** `docs/team-workflow.md` (4-person team roles, branching strategy, conflict recovery).
- [x] **API Agreement Framework:** `docs/api-contract-template.md` (for rapid agreement within 15 minutes of receiving the prompt).
- [x] **Tool & Runtime Verification:** `docs/tech-stack-and-versions.md` (audited local versions: Node.js v22.17.0, npm 10.9.2, Git 2.50.1, Docker 29.6.1).
- [x] **Environment Variable Template:** `.env.example` with safe, placeholder defaults and port conflict prevention.
- [x] **Container Infrastructure:** `docker-compose.yml` for PostgreSQL 16 on host port 5435 (preventing collisions with local port 5432 and external project containers on 5434).
- [x] **Automated Preflight Check:** `scripts/preflight.ps1` (PowerShell) and `scripts/preflight.sh` (Bash) checking Node, npm, Git, Docker, ports, and registry connectivity without leaking secrets.
- [x] **Venue Kickoff Playbook:** `docs/venue-kickoff-guide.md` and `scripts/venue-kickoff.ps1` providing tested commands to initialize Next.js + NestJS + Prisma immediately once the event starts.

## Package Manager Decision Record (Migration to npm)

- **Decision:** Migrate the entire repository package management workflow from pnpm to **npm** (v10.9.2).
- **Rationale:** To eliminate extraneous tool requirements across all 4 team members' laptops, utilize the built-in Node.js package manager (`npm`), ensure seamless CI integration via `npm ci`, and avoid symlink/hoisting edge cases under Windows development during a fast-paced 5-hour hackathon.
- **Scope:** All root scripts, preflight validation scripts, venue kickoff automation, CI workflows, and documentation were updated to use npm exclusively.

## Transitioning to Development at the Venue

Once organizers officially release the problem statement and allow coding to begin (or confirm starter code is permitted):
1. Run `./scripts/preflight.ps1` to confirm venue connectivity.
2. Follow `docs/venue-kickoff-guide.md` or execute `./scripts/venue-kickoff.ps1` to scaffold the full-stack architecture in under 2 minutes.
