# Venue Kickoff Playbook (Minute 0 Execution - npm)

Once the hackathon officially starts, the problem statement is released, and application development is authorized, follow this playbook to initialize the full stack in under 3 minutes.

---

## 1. Quick Launch via Automated Kickoff Script

We have prepared a pre-tested venue kickoff script that automates monorepo scaffolding non-interactively using npm:

```powershell
# In Windows PowerShell from repo root:
powershell -ExecutionPolicy Bypass -File .\scripts\venue-kickoff.ps1
```

This script:
1. Verifies `.env` exists (copies `.env.example` if not present).
2. Configures npm `workspaces: ["apps/*", "packages/*"]` in root `package.json`.
3. Scaffolds `apps/web` (Next.js with App Router, TypeScript, Tailwind CSS via npm).
4. Scaffolds `apps/api` (NestJS with TypeScript, CORS, and `/api/health` endpoint via npm).
5. Initializes Prisma with PostgreSQL schema pointing to host port 5435.
6. Starts the PostgreSQL container via Docker Compose.

---

## 2. Manual Step-by-Step Scaffolding (Alternative)

If you prefer executing the CLI steps manually or need fine-grained customization:

### Step 1: Initialize Workspace Configuration
In the root `package.json`, add the `workspaces` field:
```json
{
  "name": "hackathon-offline-prep",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### Step 2: Start PostgreSQL Database
```powershell
npm run db:up
```
Verify container is healthy:
```powershell
docker compose ps
```

### Step 3: Scaffold Next.js Frontend (`apps/web`)
Run non-interactively using npm:
```powershell
npx --yes create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-npm
```

In `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

### Step 4: Scaffold NestJS Backend (`apps/api`)
```powershell
npx --yes @nestjs/cli@latest new apps/api --package-manager npm --skip-git
```

In `apps/api/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
```

### Step 5: Setup Prisma Database Client
```powershell
npm install -D prisma --workspace=apps/api
npm install @prisma/client --workspace=apps/api

# Initialize Prisma inside apps/api
cd apps/api
npx prisma init
```

Set the `DATABASE_URL` in `apps/api/.env`:
```env
DATABASE_URL="postgresql://hackathon:localdev_only_change_me@localhost:5435/hackathon?schema=public"
```

---

## 3. Daily Development Commands

Once initialized:

```powershell
# Start frontend alone
npm run dev --workspace=apps/web

# Start backend alone
npm run start:dev --workspace=apps/api

# Run database migration (after adding models to prisma/schema.prisma)
cd apps/api; npx prisma migrate dev --name init

# Open Prisma Studio visual database editor
cd apps/api; npx prisma studio
```
