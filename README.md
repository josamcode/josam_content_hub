# JoSam Content Hub

Private personal content operations platform for JoSam Code to manage video and content workflow across TikTok, Instagram, Facebook, and YouTube.

## Purpose

JoSam Content Hub is not just a scheduler. It manages the full personal content workflow:

Idea -> Script -> Media -> Platform Versions -> Schedule -> Reminder -> Manual Publish -> Publish Logs

The current MVP is built for a local, personal workflow. It helps track content from early idea through platform-specific publishing records without requiring live social platform integrations yet.

## Current MVP Features

### Backend

- Auth with JWT
- Content item CRUD
- Platform posts per content item
- Queue slots for reusable posting times
- Schedules and calendar API
- Reminders for manual publishing
- Manual publishing completion flow
- Publish attempts and publish logs
- Dashboard summary API
- Media upload with local storage

### Frontend

- Login
- Dashboard
- Content library
- Create content
- Content details
- Platform composer
- Scheduling UI
- Calendar
- Reminders
- Queue settings
- Publish logs
- Media upload

## Tech Stack

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- JWT
- Multer with local uploads

### Frontend

- React
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS

## Project Structure

```text
josam-content-hub/
  backend/
  frontend/
  README.md
```

- `backend/`: Express API, Prisma schema, database migrations, auth, scheduling, reminders, publishing, dashboard, and uploads.
- `frontend/`: React/Vite app for the private content workflow UI.
- `README.md`: Root setup and handoff documentation.

## Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Default backend URL:

```text
http://localhost:5000/api/v1
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite will print the actual local URL in the terminal.

## Environment Variables

### Backend

Required backend variables:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SEED_USER_NAME`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`
- `UPLOAD_DIR`
- `PUBLIC_UPLOAD_BASE_URL`

Use `backend/.env.example` as the starting point.

### Frontend

Required frontend variable:

- `VITE_API_BASE_URL`

Example:

```text
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Local Workflow Verification

Use this checklist to verify the MVP locally:

1. Login.
2. Open the dashboard.
3. Create a content item.
4. Upload a video and thumbnail.
5. Edit content info.
6. Edit a platform caption and hashtags.
7. Mark the platform post ready.
8. Schedule the platform post manually.
9. Confirm the schedule appears in Calendar.
10. Confirm a Reminder appears.
11. Mark the reminder as published with a URL.
12. Confirm the entry appears in Publish Logs.
13. Confirm Dashboard updates.
14. Add, edit, and deactivate a Queue Settings slot.

## Useful Commands

### Backend

```bash
npm run dev
npx prisma validate
npx prisma generate
npm run backup:postgres
npm run backup:uploads
npm audit --omit=dev
```

### Frontend

```bash
npm run dev
npm run build
npm audit --omit=dev
```

### Git

```bash
git status --short
git log --oneline -10
```

## Upload Behavior

- Uploads are stored locally under `backend/uploads`.
- Uploaded files are served from `/uploads`.
- Media previews work across frontend/backend origins because the backend sets `Cross-Origin-Resource-Policy: cross-origin` for `/uploads` only.
- Uploads are public in the MVP.
- Cloud storage is not implemented yet.

## Staging Deployment Runbook

### Deployment Overview

The staging environment has four deployable/runtime parts:

- Backend API: Node.js/Express app served by `backend/src/server.js`.
- Frontend static app: Vite production build served from `frontend/dist`.
- PostgreSQL database: Prisma-managed schema and application data.
- Persistent uploads storage: local disk path mounted at `UPLOAD_DIR`.

### Backend Required Env Vars

Set these variables for the backend staging service:

```text
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
SEED_USER_NAME=...
SEED_USER_EMAIL=...
SEED_USER_PASSWORD=...
UPLOAD_DIR=/persistent/uploads
PUBLIC_UPLOAD_BASE_URL=https://api.example.com/uploads
FRONTEND_URL=https://app.example.com
ALLOWED_ORIGINS=https://app.example.com
```

### Frontend Required Env Vars

Set the API URL when building the frontend:

```text
VITE_API_BASE_URL=https://api.example.com/api/v1
```

### Backend Deployment Commands

```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm start
```

Important: `npm run prisma:seed` is for first staging bootstrap only. Do not run it every deployment unless intentional.

### Frontend Deployment Commands

```bash
cd frontend
npm ci
VITE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```

Serve `frontend/dist` with SPA fallback to `index.html` because the app uses `BrowserRouter`.

### Upload Persistence

- Uploads are local disk files under `UPLOAD_DIR`.
- `UPLOAD_DIR` must be a persistent volume or storage mount.
- Ephemeral hosting filesystems will lose uploaded media.
- Current media URLs are relative `/uploads/...` paths, and the frontend derives the media origin from `VITE_API_BASE_URL`.
- CDN or object storage requires a later code/storage change.

### CORS

- Production requires `FRONTEND_URL` or `ALLOWED_ORIGINS`.
- Set `ALLOWED_ORIGINS` to the frontend domain.
- Do not use wildcard origins in production.

### Health Check

```text
GET /api/v1/health
```

### Smoke Test

```bash
cd backend
SMOKE_API_BASE_URL=https://api.example.com/api/v1
SMOKE_USER_EMAIL=...
SMOKE_USER_PASSWORD=...
npm run smoke:test
```

Note: the smoke test mutates staging data and uploads files.

### PostgreSQL Backups

Use the PostgreSQL backup runbook before migrations, before risky deploys, and on a daily production/staging schedule:

```text
docs/operations/postgres-backup-restore.md
```

The backend helper command is manual and opt-in:

```bash
cd backend
npm run backup:postgres
```

It reads `BACKUP_DATABASE_URL` or `DATABASE_URL`, writes timestamped `pg_dump --format=custom --no-owner --no-acl` files under `BACKUP_DIR` defaulting to `./backups/postgres`, and refuses non-local database hosts unless `BACKUP_ALLOW_REMOTE=true` is set in the current secure shell/session.

### Uploads Backups

Use the uploads backup runbook for files stored under `UPLOAD_DIR`:

```text
docs/operations/uploads-backup-restore.md
```

The backend helper command is manual and opt-in:

```bash
cd backend
npm run backup:uploads
```

It reads `BACKUP_UPLOADS_DIR` or `UPLOAD_DIR`, writes timestamped `.tar.gz` archives under `BACKUP_DIR` defaulting to `./backups/uploads`, and fails safely if the uploads directory is missing. Treat PostgreSQL backups and uploads backups as a pair from the same backup window because `MediaAsset` database records depend on files existing on disk.

### Disaster Recovery

Review the disaster recovery runbook before relying on production content and before YouTube integration:

```text
docs/operations/disaster-recovery.md
```

The disaster recovery process restores PostgreSQL and uploads from the same backup window, verifies core app workflows, and avoids destructive restore automation.

### Known Staging Risks

- Local uploads require persistent disk.
- PostgreSQL backups and uploads backups must be stored outside the Coolify host before relying on real content.
- Multiple backend instances each start the missed-reminder worker.
- Prisma CLI is currently in `devDependencies`, so the deploy pipeline must install dev dependencies for migrate/generate or change deployment strategy later.
- Vite large chunk warning is non-blocking.
- `.claude/settings.json` should not be committed accidentally.

### Recommended Deployment Order

1. Provision PostgreSQL.
2. Provision persistent uploads.
3. Configure backend env.
4. Install backend deps.
5. Run `npx prisma generate`.
6. Run `npx prisma migrate deploy`.
7. Seed once.
8. Start backend.
9. Verify health.
10. Build frontend with `VITE_API_BASE_URL`.
11. Deploy frontend with SPA fallback.
12. Run smoke test.

## Known Limitations

- No auto publishing yet.
- No YouTube, Meta, or TikTok OAuth yet.
- No analytics yet.
- No platform settings page yet.
- No background worker yet.
- No automated tests yet.
- Uploads are local and public.
- JWT is stored in localStorage.
- The app is not production hardened yet.

## Roadmap Next

Recommended order:

1. Platform Settings page
2. Deployment readiness
3. Basic smoke tests
4. Upload backup/storage plan
5. YouTube integration research
6. Analytics foundation later

Review `docs/operations/postgres-backup-restore.md`, `docs/operations/uploads-backup-restore.md`, and `docs/operations/disaster-recovery.md` before starting YouTube integration.

## MVP Status

The current MVP is usable for a personal/local workflow.

It is not production-ready yet.
