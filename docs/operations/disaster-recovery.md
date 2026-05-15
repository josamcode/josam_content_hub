# Disaster Recovery Runbook

## Purpose

This runbook explains how to recover JoSam Content Hub after operational incidents such as:

- PostgreSQL data loss or corruption.
- Coolify uploads volume loss.
- A bad migration or deploy.
- Accidental data damage.

It is documentation only. It does not provide destructive restore automation. Restore commands must be reviewed for the target environment before use.

## Core Principle

Restore the PostgreSQL dump and uploads archive from the same backup window.

The database stores `MediaAsset` rows with relative file URLs such as `/uploads/...` and storage keys such as `videos/<contentItemId>/<filename>`. Those rows point to files that must exist under the uploads directory.

If the database is restored without matching uploads, media previews can break because records point to missing files. If uploads are restored without the matching database, the volume can contain orphan files that the app cannot reference.

## Disaster Recovery Levels

- Minor issue: roll back the app deploy only. Use this when code is bad but the database and uploads are intact.
- DB issue: restore PostgreSQL only. Use this when uploads are known to be intact and the selected database backup matches the current uploads state closely enough.
- Uploads issue: restore `/app/uploads` only. Use this when database records are intact and the selected archive matches the current database state.
- Full recovery: restore PostgreSQL and uploads together. Use this for host loss, volume loss, database loss, or unclear corruption.

When uncertain, treat the incident as full recovery and restore a matched pair.

## Pre-Restore Checklist

1. Identify the incident time and likely cause.
2. Choose a PostgreSQL `.dump` and uploads `.tar.gz` from the same backup window.
3. Confirm the backup files are readable:

```bash
pg_restore --list path/to/postgres.dump
tar -tzf path/to/uploads.tar.gz
```

4. Freeze the app or stop writes. For production, temporarily stop the backend or otherwise prevent users from writing data.
5. Notify the user/admin that the app is in restore mode.
6. Take an emergency backup of the current broken database and uploads volume if possible.
7. Confirm the target environment: staging or production.
8. Do not test a destructive restore directly on production first if staging or a temporary restore target is available.

## Database Restore Overview

Use a custom-format PostgreSQL dump created with the Postgres backup runbook:

```text
docs/operations/postgres-backup-restore.md
```

Safe restore approach:

1. Create or prepare a clean target database.
2. Restore with `pg_restore`.
3. Avoid restoring into a dirty database unless that is intentional and documented.
4. Run migrations only if needed and understood. Do not blindly run migrations during incident recovery.
5. Keep production secrets in Coolify/env or a secure shell session only. Do not commit or paste real `DATABASE_URL` values into docs, scripts, or logs.

Example shape only:

```bash
createdb josam_content_hub_restore
pg_restore --clean --if-exists --no-owner --no-acl --dbname josam_content_hub_restore path/to/postgres.dump
```

For production, prefer restoring into a new clean database, validating it, then repointing the backend when ready.

## Uploads Restore Overview

Use an uploads archive created with the uploads backup runbook:

```text
docs/operations/uploads-backup-restore.md
```

Safe restore approach:

1. Confirm the configured production uploads path. Expected production path:

```text
/app/uploads
```

2. Preserve the existing broken volume contents first if uncertain.
3. Restore the archive into the configured uploads directory.
4. Preserve the folder structure inside the archive.
5. Verify the backend process can read the restored files.

Example shape only:

```bash
mkdir -p /app/uploads
tar -xzf path/to/uploads.tar.gz -C /app/uploads
```

Do not overwrite blindly if you are unsure which archive matches the database. Do not delete or remount the Coolify persistent volume without a confirmed external backup.

## Full Restore Order

1. Freeze the app or stop backend writes.
2. Back up the current broken state if possible.
3. Restore PostgreSQL to a clean database from the selected dump.
4. Restore uploads from the matching archive to `/app/uploads`.
5. Confirm backend environment points to the restored database and uploads path.
6. Start the backend.
7. Verify health, login, core pages, and media.
8. Unfreeze the app only after verification passes.

## Verification Checklist After Restore

Backend and logs:

- Check `GET /api/v1/health`.
- Check backend startup logs.
- Check backend error logs after browsing core pages.

Frontend workflow:

- Log in.
- Open Dashboard.
- Open Content Library.
- Open Content Details for items with media.
- Preview or open uploaded media from `/uploads/...`.
- Open Calendar.
- Open Reminders.
- Open Publish Logs.
- Open Queue Settings.
- Open Platform Settings.
- Open Category Defaults.
- Check the browser console for failed API calls or media load errors.

If media records exist but previews fail, stop and verify that the uploads archive matches the database dump and that files were restored below the correct uploads directory.

## Smoke Test Warning

The current backend smoke test mutates data and uploads files. It creates content, schedules, publish attempts, queue slot changes, and media files.

Use `npm run smoke:test` only intentionally on staging or after accepting that test data will be created. For production restore verification, prefer manual/read-only checks until a read-only production smoke check exists.

## Rollback Or Failed Restore Handling

- Keep the old database and volume snapshot if possible.
- If restore fails, do not leave the partially restored app open for writes.
- Re-freeze the app or keep the backend stopped.
- Restore the previous known-good database/uploads pair, or retry with a different matched pair.
- Document what failed, which backup files were used, and what was changed.
- Do not continue by mixing unrelated database dumps and uploads archives unless the mismatch is understood and accepted.

## Coolify-Specific Notes

- Confirm the PostgreSQL service/container before running `pg_restore`.
- Confirm the uploads persistent volume destination path before extracting archives.
- Keep production secrets in Coolify/env or a secure shell/session only.
- Copy backup files off-server after creation.
- Do not rely only on backups stored on the same VPS or the same Coolify host.
- Actual Coolify service names, host paths, and volume names cannot be verified from the local repository.

## Restore Drill Recommendation

Practice restore on staging before relying on this process in production.

Run a drill monthly or before major integrations such as YouTube OAuth/publishing. At minimum, verify one real content item with uploaded media after the drill.

## Emergency Checklist

1. Freeze app writes.
2. Identify incident time.
3. Select matching PostgreSQL dump and uploads archive.
4. Verify both backup files can be listed.
5. Emergency-backup current broken state if possible.
6. Restore database to a clean target.
7. Restore uploads to `/app/uploads`.
8. Start backend.
9. Verify health, login, core pages, and media previews.
10. Keep app frozen if verification fails.
11. Document the restore files used and final status.
