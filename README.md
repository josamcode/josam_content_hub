# JoSam Content Hub

Private personal content operations platform for JoSam Code to manage video and content workflow across TikTok, Instagram, Facebook, and YouTube.

## Purpose

JoSam Content Hub is not just a scheduler. It manages the full personal content workflow:

Idea -> Script -> Media -> Platform Versions -> Schedule -> Reminder -> Manual Publish -> Publish Logs

The current MVP is built for a private personal workflow. It helps track content from early idea through platform-specific publishing records, including YouTube OAuth and upload support.

## Current Production Status

- Backend runs on Coolify at `https://api-content.josamcode.com`.
- Frontend runs on Vercel at `https://content.josamcode.com`.
- PostgreSQL stores application data.
- Uploaded media is stored on persistent backend storage.
- YouTube OAuth works in production.
- Manual YouTube upload works in production.
- Scheduled YouTube auto-upload worker is implemented and has passed a controlled production activation test.
- The scheduled worker is disabled by default and should stay disabled unless auto uploads are intentionally being processed.
- See the YouTube worker runbook: `docs/operations/youtube-auto-upload-worker.md`.

## Current Product Direction

The current goal is practical AI-assisted publishing, not a generic content OS.

- Videos are uploaded one by one for now; a separate bulk upload page is not a priority.
- AI should generate platform-specific metadata from one idea or prompt field.
- The user manually chooses exact publish dates and times per video and platform.
- The system auto-publishes where official APIs allow it.
- Email notifications should use NodeMailer with SMTP and run best-effort so email failures do not break publishing.
- Uploads stay on the Coolify persistent volume for now.
- A Media Library / Server Media Manager is planned for storage visibility, cleanup, and missing-media handling.
- Meta and TikTok integrations are planned through official APIs only.

See the practical roadmap: `docs/product/practical-ai-publishing-roadmap.md`.

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
- YouTube OAuth connect/status/disconnect
- Manual YouTube upload
- Scheduled YouTube auto-upload worker, disabled by default

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

YouTube integration variables:

- `TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `YOUTUBE_UPLOAD_PRIVACY_STATUS`
- `YOUTUBE_DEFAULT_CATEGORY_ID` optional
- `YOUTUBE_AUTO_UPLOAD_WORKER_ENABLED`, default `false`
- `YOUTUBE_AUTO_UPLOAD_WORKER_INTERVAL_MS`
- `YOUTUBE_AUTO_UPLOAD_WORKER_BATCH_SIZE`
- `YOUTUBE_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS`

Meta (Facebook/Instagram) integration variables (planned; all optional):

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_OAUTH_SUCCESS_REDIRECT_URL`
- `META_OAUTH_ERROR_REDIRECT_URL`
- `META_AUTO_UPLOAD_WORKER_ENABLED`, default `false`
- `META_AUTO_UPLOAD_WORKER_INTERVAL_MS`
- `META_AUTO_UPLOAD_WORKER_BATCH_SIZE`
- `META_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS`

Do not commit real Meta secrets. Meta integration is planned and not yet implemented.

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

### Read-Only Smoke And Monitoring

Use the read-only smoke runbook for production/staging verification after deploys and restores:

```text
docs/operations/production-smoke-monitoring.md
```

The backend helper command is:

```bash
cd backend
npm run smoke:readonly
```

It uses GET requests for API checks after login, with an optional `HEAD` check for media files, and does not create, update, delete, upload, schedule, or publish content. The existing `npm run smoke:test` remains mutating and should stay staging/manual only.

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

### Security Checklist

Review the security checklist before YouTube integration:

```text
docs/operations/security-checklist.md
```

It covers login rate limiting, seed/password safety, JWT/localStorage risk, and OAuth token handling requirements before adding Google/YouTube credentials.

### YouTube Integration Plan

Review the YouTube integration technical design and current implementation status:

```text
docs/integrations/youtube-integration-plan.md
```

The scheduled YouTube auto-upload worker runbook is:

```text
docs/operations/youtube-auto-upload-worker.md
```

### Known Staging Risks

- Local uploads require persistent disk.
- PostgreSQL backups and uploads backups must be stored outside the Coolify host before relying on real content.
- Multiple backend instances each start the missed-reminder worker.
- The scheduled YouTube worker is in-process and disabled by default. Do not leave it enabled unless auto uploads are intentionally running.
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

- Scheduled YouTube auto-upload is implemented, but should remain disabled unless intentionally running due uploads.
- No always-on external queue or separate worker service yet.
- No Meta or TikTok OAuth yet.
- No NodeMailer SMTP email notification system yet.
- No AI metadata generation yet.
- No Media Library / Server Media Manager yet.
- No analytics yet.
- No richer frontend worker state yet.
- No `externalVideoId` field yet.
- No automated tests yet.
- Uploads are local and public.
- JWT is stored in localStorage.
- The app still needs more production hardening.

## Roadmap Next

Recommended order:

1. Add `NotificationEvent` foundation without sending email yet.
2. Add NodeMailer SMTP email infrastructure.
3. Hook best-effort email alerts into YouTube manual upload and scheduled worker flows.
4. Add Media Library / Server Media Manager for storage cleanup and missing-media visibility.
5. Add AI Brand Profile.
6. Add AI metadata generation from one idea field.
7. Add Content Details AI metadata UI.
8. Add Schedule Matrix inside Content Details.
9. Add Monthly Planning View as a planning view, not a bulk upload page.
10. Add Meta and TikTok integrations through official APIs only.

Review `docs/operations/postgres-backup-restore.md`, `docs/operations/uploads-backup-restore.md`, `docs/operations/disaster-recovery.md`, and `docs/operations/security-checklist.md` before risky production changes.

Product roadmap:

```text
docs/product/practical-ai-publishing-roadmap.md
```

## MVP Status

The current MVP is usable for the private JoSam content workflow in production, with YouTube OAuth, manual upload, and a disabled-by-default scheduled YouTube worker. The next product direction is practical AI-assisted publishing with manually controlled scheduling, useful email notifications, media cleanup tools, and official API integrations.
