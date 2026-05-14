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

## MVP Status

The current MVP is usable for a personal/local workflow.

It is not production-ready yet.
