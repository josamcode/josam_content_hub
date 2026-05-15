# YouTube Auto-Upload Worker Runbook

## Purpose

The YouTube auto-upload worker is an in-process backend worker for scheduled YouTube publishing. It processes due YouTube `PlatformPost` records through their `Schedule` when all of these are true:

- `publishMode = auto`
- `status = scheduled`
- `scheduledAt <= now`
- `nextAttemptAt` is `null` or due
- `platformPostUrl = null`

Uploads are real YouTube uploads. Use this runbook before any controlled activation.

Product roadmap context: `docs/product/practical-ai-publishing-roadmap.md`.

## Safety Defaults

The worker is disabled by default:

```text
YOUTUBE_AUTO_UPLOAD_WORKER_ENABLED=false
```

The backend only starts the worker when this value is exactly `true`. It does not run in `NODE_ENV=test`.

## Environment Variables

- `YOUTUBE_AUTO_UPLOAD_WORKER_ENABLED`: starts the worker only when set to `true`.
- `YOUTUBE_AUTO_UPLOAD_WORKER_INTERVAL_MS`: interval between worker ticks.
- `YOUTUBE_AUTO_UPLOAD_WORKER_BATCH_SIZE`: maximum schedules claimed per tick.
- `YOUTUBE_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS`: maximum attempts before a schedule becomes terminal failed.

For controlled tests, use `BATCH_SIZE=1` and `MAX_ATTEMPTS=1`.

## Pre-Activation Checklist

Confirm all items before enabling the worker:

- Migrations are deployed.
- Prisma client has been generated.
- YouTube is connected for the target user.
- `TOKEN_ENCRYPTION_KEY` is unchanged from the value used when tokens were stored.
- Uploaded video exists on persistent storage.
- YouTube title exists on the target platform post.
- Target schedule is `publishMode=auto`, `status=scheduled`, and due.
- Target `platformPostUrl` is `null`.
- Due count query returns `COUNT = 1` unless intentionally processing multiple uploads.

## Due Schedule Count Query

Run from `backend`:

```bash
node -e "require('dotenv').config(); const prisma=require('./src/config/prisma'); (async()=>{const now=new Date(); const where={status:'scheduled',publishMode:'auto',scheduledAt:{lte:now},OR:[{nextAttemptAt:null},{nextAttemptAt:{lte:now}}],platformPost:{platform:'youtube',platformPostUrl:null}}; const rows=await prisma.schedule.findMany({where,select:{id:true,platformPostId:true,scheduledAt:true,status:true,publishMode:true,attemptCount:true,nextAttemptAt:true}}); console.log(JSON.stringify({COUNT:rows.length,rows},null,2));})().finally(()=>prisma.$disconnect());"
```

Proceed only when `COUNT = 1` for a single controlled activation.

## Controlled Activation Steps

1. Set local or Coolify runtime env for the backend process:

```text
YOUTUBE_AUTO_UPLOAD_WORKER_ENABLED=true
YOUTUBE_AUTO_UPLOAD_WORKER_INTERVAL_MS=15000
YOUTUBE_AUTO_UPLOAD_WORKER_BATCH_SIZE=1
YOUTUBE_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS=1
```

2. Restart the backend.
3. Watch backend logs.
4. Wait for one clear success or failure result.
5. Disable the worker again unless intentionally continuing auto uploads.
6. Restart the backend after disabling.
7. Inspect the target schedule, platform post, and publish attempt.

## Expected Success

- Worker log includes `success=1 retry=0 failed=0`.
- `Schedule.status = published`.
- `PlatformPost.status = published`.
- `PlatformPost.platformPostUrl` is saved.
- `PublishAttempt.status = success`.
- Duplicate upload is blocked by the existing `platformPostUrl` and completed-status checks.

## Expected Safe Failure

- No tokens, client secrets, authorization codes, or raw OAuth responses are logged.
- `PublishAttempt.status = failed`.
- Schedule moves to `failed`, or returns to scheduled with retry metadata when retry is allowed.
- `lastError` and publish attempt `errorMessage` contain safe messages only.
- `platformPostUrl` remains `null` unless a YouTube video was already created and local recovery saved the URL.

## Production Caution

- Do not leave the worker enabled unless intentionally running auto uploads.
- Never enable it when due count is greater than `1` unless intentionally processing multiple uploads.
- YouTube uploads are real and may consume quota.
- Test videos should be deleted from YouTube Studio if they are not needed.
- Keep OAuth credentials, tokens, passwords, and `TOKEN_ENCRYPTION_KEY` out of docs, logs, commits, and chat.
