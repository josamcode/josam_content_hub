# Uploads Backup and Restore Runbook

## Purpose

JoSam Content Hub stores uploaded media files on local disk under `UPLOAD_DIR`. In production on Coolify, this is expected to be the persistent volume mounted at `/app/uploads`.

The database stores `MediaAsset` records with relative file URLs such as `/uploads/...` and storage keys such as `videos/<contentItemId>/<filename>`. Those database rows only remain useful if the matching files still exist on disk with the same directory structure.

## Backup Window Must Match The Database

Uploads backups and PostgreSQL backups must be treated as a pair. A database backup can reference files that were uploaded after the uploads archive was made, and an uploads archive can contain files that do not exist in an older database backup.

For reliable restore, capture both backups from the same operational window:

1. Freeze writes or choose a quiet period.
2. Run the PostgreSQL backup.
3. Run the uploads backup.
4. Store both backup artifacts together with matching timestamps.

## What Is Backed Up

- Production: `/app/uploads` on the Coolify persistent volume.
- Local development: usually `backend/uploads` when viewed from the repo root, or `./uploads` when running commands from `backend`.
- The archive preserves the contents below the uploads directory, including `videos/`, `thumbnails/`, `images/`, and `attachments/`.

## Required Environment Variables

The helper script reads:

- `BACKUP_UPLOADS_DIR` preferred uploads source path.
- `UPLOAD_DIR` fallback uploads source path.
- `BACKUP_DIR` optional archive output directory, defaults to `./backups/uploads`.
- `BACKUP_TAR_BIN` optional path to `tar` when it is not on `PATH`.

Never commit generated archives. Do not put secrets in backup paths or archive names.

## Local Or Staging Manual Backup

From the backend directory:

```bash
cd backend
npm run backup:uploads
```

With an explicit source:

```bash
cd backend
BACKUP_UPLOADS_DIR=./uploads BACKUP_DIR=./backups/uploads npm run backup:uploads
```

On Windows PowerShell:

```powershell
cd backend
$env:BACKUP_UPLOADS_DIR="./uploads"
$env:BACKUP_DIR="./backups/uploads"
npm run backup:uploads
```

The script creates a timestamped `.tar.gz` archive, creates the output directory if needed, prints the archive path and size on success, and exits non-zero on failure. If the uploads directory is missing, it fails rather than creating an empty or misleading backup.

The helper uses system `tar`. If `tar` is missing, install it or set `BACKUP_TAR_BIN`.

## Coolify Production Guidance

For production, first confirm the real persistent volume destination path in Coolify. The expected application value is:

```text
UPLOAD_DIR=/app/uploads
```

Run the backup from a trusted shell, container, or host that can read that persistent volume:

```bash
cd backend
export BACKUP_UPLOADS_DIR="/app/uploads"
export BACKUP_DIR="/secure/backups/uploads"
npm run backup:uploads
```

Copy the resulting archive off the server after it is created. A backup that only remains on the same Coolify host or volume is not sufficient protection from host loss, volume deletion, or operator error.

Actual Coolify host paths, volume names, and container names must be confirmed in Coolify before use; they cannot be verified from the local repository.

## Backup Storage Destination Options

- S3-compatible object storage such as Cloudflare R2, Backblaze B2, AWS S3, or Wasabi.
- A second VPS or storage box over SSH.
- Encrypted external storage managed outside the Coolify host.

Cloud upload automation is intentionally not implemented in this phase.

## Frequency

- Daily while staging or production contains real uploaded media.
- After large upload sessions.
- Before risky deploys, manual volume work, migrations, or infrastructure changes.

## Retention Recommendation

- Daily archives: keep 14-30 days.
- Weekly archives: keep 8-12 weeks.
- Monthly archives: add later once the platform contains long-lived production content.

Keep uploads archives aligned with PostgreSQL backup retention so a matching DB/files pair is available.

## Verify A Backup

After each backup:

1. Confirm the archive exists.
2. Confirm the archive size is non-zero.
3. List archive contents without extracting:

```bash
tar -tzf path/to/uploads-backup.tar.gz
```

Check that expected media type folders are present when files exist.

## Restore Overview

Restore is intentionally documented, not automated, because restoring files to the wrong volume can overwrite or confuse production media.

High-level process:

1. Freeze the app by stopping writes or temporarily stopping the backend.
2. Restore PostgreSQL from the matching backup window.
3. Restore uploads from the matching archive to the configured uploads directory, such as `/app/uploads`.
4. Preserve the directory structure inside the archive.
5. Start the backend only after both database and uploads are in place.

Example shape only:

```bash
mkdir -p /app/uploads
tar -xzf path/to/uploads-backup.tar.gz -C /app/uploads
```

Do not delete, replace, or remount the Coolify uploads volume without a confirmed external backup.

## Verify After Restore

After a restore:

1. Check `GET /api/v1/health`.
2. Log in.
3. Open content details for items with media.
4. Confirm media previews open from `/uploads/...`.
5. Check reminders and manual publishing pages.
6. Check publish logs.

## Warnings

- Deleting, replacing, or changing the Coolify persistent volume can permanently lose uploaded media.
- The current backend smoke test mutates data and uploads files. Do not run it casually against production.
