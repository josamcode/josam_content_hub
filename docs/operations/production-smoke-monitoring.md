# Read-Only Smoke And Monitoring Runbook

## Purpose

This runbook defines a safe production/staging smoke check for JoSam Content Hub. It is intended for deploy verification, restore verification, and basic operational monitoring without creating content, editing settings, scheduling posts, completing publishing, deleting records, or uploading files.

## Mutating Smoke Versus Read-Only Smoke

The existing command is:

```bash
npm run smoke:test
```

That smoke test is useful for staging workflow validation, but it mutates data and uploads files. It creates content, updates platform posts, schedules posts, completes manual publishing, edits queue slots, creates publish attempts, and uploads media.

The read-only command is:

```bash
npm run smoke:readonly
```

It uses GET requests for API checks after login. The only POST is `POST /auth/login`, which is required because there is no token-free read-only auth endpoint. The optional media check uses `HEAD` to avoid downloading large files. It must not be used to change app domain data.

Important implementation note: the current `GET /platform-settings` and `GET /category-defaults` endpoints can create missing default rows if the environment was not seeded. Treat this smoke check as strictly read-only only after platform settings and category defaults already exist for the user.

## Required Environment Variables

- `SMOKE_API_BASE_URL` optional, defaults to `http://localhost:5000/api/v1`.
- `SMOKE_USER_EMAIL` required.
- `SMOKE_USER_PASSWORD` required.
- `SMOKE_FRONTEND_URL` optional.
- `SMOKE_TIMEOUT_MS` optional, defaults to `15000`.

Keep credentials in environment variables or a secure shell/session. Do not commit secrets.

## Local Command

From the backend directory:

```bash
cd backend
SMOKE_USER_EMAIL=you@example.com SMOKE_USER_PASSWORD=... npm run smoke:readonly
```

On Windows PowerShell:

```powershell
cd backend
$env:SMOKE_USER_EMAIL="you@example.com"
$env:SMOKE_USER_PASSWORD="..."
npm run smoke:readonly
```

## Production Command Example

Example shape only, with no real secrets:

```bash
cd backend
export SMOKE_API_BASE_URL="https://api-content.josamcode.com/api/v1"
export SMOKE_FRONTEND_URL="https://content.josamcode.com"
export SMOKE_USER_EMAIL="..."
export SMOKE_USER_PASSWORD="..."
npm run smoke:readonly
```

Do not run the mutating smoke command against production casually.

## Endpoints Checked

The read-only smoke script checks:

- `GET /health`
- `POST /auth/login` for authentication only
- `GET /auth/me`
- `GET /dashboard`
- `GET /content-items?limit=5`
- `GET /calendar?from=<yesterday>&to=<seven-days-from-now>`
- `GET /reminders?range=today`
- `GET /publish-attempts?limit=5`
- `GET /queue-slots?active=true`
- `GET /platform-settings`
- `GET /category-defaults`
- `GET /content-items/:id` when content exists
- `GET /content-items/:id/media` when content exists
- `HEAD <media file URL>` when a media asset exists
- `GET SMOKE_FRONTEND_URL` when configured

The script validates `success === true` and basic `data`/`meta` shapes where applicable.

## What It Intentionally Does Not Check

- Creating, editing, archiving, scheduling, or publishing content.
- Uploading media files.
- Editing queue slots.
- Updating platform settings or category defaults.
- OAuth flows or future platform integrations.
- Deep database readiness. The current `/health` endpoint checks the web process, not PostgreSQL connectivity.
- Browser-authenticated frontend navigation. The optional frontend check only verifies the root HTML response.

## When To Run

- After backend deploys.
- After frontend deploys when `SMOKE_FRONTEND_URL` is set.
- After restore or disaster recovery verification.
- Before and after risky infrastructure changes.
- Manually as a daily operational check until external monitoring is configured.

## Monitoring Recommendations

- Add an external uptime monitor for `https://api-content.josamcode.com/api/v1/health`.
- Alert when the backend health endpoint is down or returns non-2xx.
- Add an optional frontend root monitor for `https://content.josamcode.com`.
- Run `npm run smoke:readonly` manually after deploys and restores.
- Later, add a DB-aware readiness endpoint that verifies PostgreSQL connectivity without exposing sensitive data.
- Later, add structured logs and alerting for repeated 5xx responses.

## Warning

`npm run smoke:test` mutates data and uploads files. Keep it staging/manual only unless production test data creation is explicitly accepted.
