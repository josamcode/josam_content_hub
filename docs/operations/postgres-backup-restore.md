# PostgreSQL Backup and Restore Runbook

## Purpose

JoSam Content Hub stores the highest-value application state in PostgreSQL: users, content items, platform posts, schedules, reminders, publish attempts, settings, and media asset records.

This runbook defines a manual, safe backup flow for local, staging, and production. Upload files under `UPLOAD_DIR` are not covered here and must be restored from a matching uploads backup window in a later phase.

## When To Run A Backup

- Daily for staging/production while the app contains real content.
- Before `npx prisma migrate deploy`.
- Before risky deploys or manual database maintenance.
- Before changing production environment variables that affect database access.

## Required Environment Variables

The helper script reads:

- `BACKUP_DATABASE_URL` preferred, or `DATABASE_URL` as fallback.
- `BACKUP_DIR` optional, defaults to `./backups/postgres`.
- `BACKUP_ALLOW_REMOTE=true` required when backing up a non-local database with the helper.
- `PG_DUMP_BIN` optional path to `pg_dump` when it is not on `PATH`.

Never commit real database URLs, passwords, or generated backup files.

## Local Or Staging Manual Backup

From the backend directory:

```bash
cd backend
BACKUP_DATABASE_URL=postgresql://postgres:password@localhost:5432/josam_content_hub npm run backup:postgres
```

On Windows PowerShell:

```powershell
cd backend
$env:BACKUP_DATABASE_URL="postgresql://postgres:password@localhost:5432/josam_content_hub"
npm run backup:postgres
```

The script runs:

```text
pg_dump --format=custom --no-owner --no-acl
```

It writes a timestamped `.dump` file to `BACKUP_DIR`, creates the directory if needed, prints the output path and size, and exits non-zero on failure. It does not print the database URL or password.

If `pg_dump` is missing, install PostgreSQL client tools or set `PG_DUMP_BIN` to the executable path.

## Coolify Production Guidance

For production, prefer running `pg_dump` from the Coolify PostgreSQL container or from a trusted runner that can securely reach the database.

Use the production `DATABASE_URL` only inside a secure shell/session. Do not paste it into committed files, screenshots, issue comments, shell history you keep, or shared logs.

Example shape only:

```bash
cd backend
export BACKUP_DATABASE_URL="postgresql://..."
export BACKUP_ALLOW_REMOTE=true
export BACKUP_DIR="/secure/backups/postgres"
npm run backup:postgres
```

If running directly inside the DB container, an equivalent `pg_dump --format=custom --no-owner --no-acl --file <backup-file> "$DATABASE_URL"` is acceptable. Move the resulting backup to durable storage outside the container/host.

Actual Coolify service names, container names, and production credentials must be confirmed in Coolify before use; they cannot be verified from the local repository.

## Retention Recommendation

- Daily backups: keep 14-30 days.
- Weekly backups: keep 8-12 weeks.
- Monthly backups: add later once the platform contains long-lived production content.

Store at least one copy outside the Coolify host, such as S3-compatible object storage, encrypted SSH storage, or another managed backup destination.

## Verify A Backup

After each backup:

1. Confirm the file exists.
2. Confirm the file size is non-zero.
3. Optionally inspect the archive without restoring:

```bash
pg_restore --list path/to/backup.dump
```

This verifies the dump is readable enough for `pg_restore` to list its contents.

## Restore Overview

Restore is intentionally documented, not automated, because it is destructive when pointed at the wrong database.

High-level process:

1. Freeze the app during restore by stopping writes or temporarily stopping the backend.
2. Create or select a clean target database.
3. Restore with `pg_restore` into the clean database.
4. Restore uploads from the matching backup window once uploads backup exists.
5. Point the backend at the restored database only after validation.

Example shape only:

```bash
createdb josam_content_hub_restore
pg_restore --clean --if-exists --no-owner --no-acl --dbname josam_content_hub_restore path/to/backup.dump
```

Do not restore over production without a fresh backup and an explicit maintenance window.

## Verify After Restore

After a restore:

1. Check `GET /api/v1/health`.
2. Log in.
3. Open the dashboard.
4. Open the content list.
5. Check calendar and reminders.
6. Check publish logs.
7. Spot-check media records and, after uploads restore exists, media previews.

## Smoke Test Warning

The current backend smoke test mutates data and uploads files. It creates content, schedules, publish attempts, queue slot changes, and media files. Do not run it casually against production.
