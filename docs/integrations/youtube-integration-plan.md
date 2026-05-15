# YouTube Integration Technical Design

## 1. Goal

The first YouTube integration should let JoSam connect one YouTube account and publish YouTube videos from existing JoSam Content Hub data.

Initial goal:

- Connect one YouTube account for the private user.
- Upload and optionally schedule YouTube videos using existing `ContentItem`, `PlatformPost`, `Schedule`, and `MediaAsset` data.
- Use YouTube metadata already captured in `PlatformPost`: `title`, `description`, `tags`, `hashtags`, `status`, and `platformPostUrl`.
- Log success and failure in `PublishAttempt`.
- Keep the existing manual publishing fallback available.

YouTube should be the first real auto-publishing integration. TikTok remains manual. Meta remains later.

## Implementation Status

Completed:

- Token encryption foundation with `TOKEN_ENCRYPTION_KEY`.
- YouTube OAuth connect/callback/status/disconnect.
- Manual YouTube upload from a YouTube `PlatformPost`.
- Publish logs polish for safe YouTube upload errors.
- Scheduled worker schema prep with retry metadata.
- Scheduled YouTube worker MVP.
- Stale recovery safety fix scoped to YouTube posts with `platformPostUrl = null`.
- Controlled production activation success: one due auto YouTube schedule was processed with `success=1 retry=0 failed=0`, the platform post became `published`, `platformPostUrl` was saved, Publish Logs showed success, and duplicate upload was blocked.

Future:

- Continuous always-on worker operation.
- Richer frontend worker state and operational controls.
- `externalVideoId` or equivalent durable YouTube video ID storage.
- Analytics import.
- Meta and TikTok integrations.

## 2. Non-goals

This phase does not include:

- TikTok integration.
- Meta/Facebook/Instagram integration.
- Analytics or YouTube performance import.
- Multi-account support.
- Team workflows or per-team OAuth.
- Public SaaS OAuth onboarding.
- Full auth redesign.
- Moving JWT auth to cookies.
- Refresh-token/session redesign for JoSam app auth.
- Video processing, trimming, transcoding, caption generation, or thumbnail generation.
- Cloud/object storage migration for uploaded media.

## 3. Current System Fit

Existing entities:

- `User`: owns content, settings, queue slots, and future connected platform accounts.
- `ContentItem`: represents the core idea/script/media workflow item.
- `MediaAsset`: stores local uploaded files under `UPLOAD_DIR`, with `type`, `fileUrl`, `storageKey`, filename, MIME type, and size.
- `PlatformPost`: already stores YouTube-ready metadata: `title`, `description`, `tags`, `hashtags`, `status`, and `platformPostUrl`.
- `Schedule`: already supports `publishMode` values `manual`, `auto`, and `reminder`, plus `scheduledAt`, `timezone`, and statuses including `processing`.
- `PublishAttempt`: already logs platform, publish mode, status, error message, response payload, and attempt time.
- `PlatformSetting`: stores per-platform enablement, default publish mode, default tags, templates, and notes.
- `PlatformAccount`: stores encrypted OAuth tokens, granted scopes, account status, account identity, and reconnect state.

Reusable pieces:

- Ownership checks can follow existing `PlatformPost`, `Schedule`, and `MediaAsset` service patterns.
- YouTube title, description, and tags can come from `PlatformPost`.
- Video and thumbnail files can come from `MediaAsset` records.
- Scheduling can use existing `Schedule.scheduledAt` and `publishMode`.
- Success/failure can use existing `PublishAttempt`.
- Platform Settings can become the UI entry point for connect/status/disconnect.

Remaining gaps:

- External YouTube video ID storage beyond `platformPostUrl`.
- Richer frontend state for worker status and operational history.
- Continuous always-on worker operation decision.
- Analytics import.
- Meta and TikTok integrations.

## 4. Data Model Status

The OAuth account model and scheduled worker retry fields have been implemented. The remaining model improvement to consider is a durable YouTube video ID field.

Implemented account model shape:

```prisma
model PlatformAccount {
  id                    String    @id @default(cuid())
  userId                String    @map("user_id")
  platform              Platform
  accountId             String?   @map("account_id")
  accountName           String?   @map("account_name")
  accessTokenEncrypted  String?   @map("access_token_encrypted")
  refreshTokenEncrypted String?   @map("refresh_token_encrypted")
  tokenExpiresAt        DateTime? @map("token_expires_at")
  scopes                String[]  @default([])
  status                String    @default("connected")
  lastError             String?   @map("last_error")
  connectedAt           DateTime  @default(now()) @map("connected_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  user                  User      @relation(fields: [userId], references: [id])

  @@unique([userId, platform])
  @@index([userId])
  @@index([platform])
  @@index([status])
  @@map("platform_accounts")
}
```

Account status values:

- `connected`
- `needs_reauth`
- `revoked`
- `error`

Additional field still to consider on `PlatformPost`:

- `externalPostId` or `externalVideoId` for the YouTube video ID.

Without `externalVideoId`, the app can store the watch URL in `platformPostUrl`, but retry handling after partial upload is weaker. If a video upload succeeds and a later thumbnail/status update fails, storing the YouTube `videoId` separately makes recovery safer.

Token encryption requires `TOKEN_ENCRYPTION_KEY` before any OAuth token is stored. Losing this key makes stored tokens unusable after restore.

## 5. Environment Variables

Required:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `TOKEN_ENCRYPTION_KEY`

YouTube defaults:

- `YOUTUBE_UPLOAD_PRIVACY_STATUS`, default `private`
- `YOUTUBE_DEFAULT_CATEGORY_ID`, optional

Scheduled worker controls:

- `YOUTUBE_AUTO_UPLOAD_WORKER_ENABLED`, default `false`
- `YOUTUBE_AUTO_UPLOAD_WORKER_INTERVAL_MS`
- `YOUTUBE_AUTO_UPLOAD_WORKER_BATCH_SIZE`
- `YOUTUBE_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS`

Local and production callback URLs must be separate and explicitly configured in Google Cloud Console.

Example callback shapes:

- Local: `http://localhost:5000/api/v1/integrations/youtube/callback`
- Production: `https://api-content.josamcode.com/api/v1/integrations/youtube/callback`

The exact local callback URL must be chosen before implementation.

## 6. OAuth Flow Design

Conceptual endpoints:

- `GET /api/v1/integrations/youtube/connect`
- `GET /api/v1/integrations/youtube/callback`
- `GET /api/v1/integrations/youtube/status`
- `DELETE /api/v1/integrations/youtube/disconnect`

Design:

1. User must be authenticated before starting connect.
2. Backend creates a cryptographically random `state` value.
3. Backend stores `state` server-side, tied to `userId`, with short expiry.
4. Backend redirects to Google OAuth consent.
5. Google redirects back to callback with `code` and `state`.
6. Backend validates `state` to prevent CSRF.
7. Backend exchanges `code` for tokens.
8. Backend verifies granted scopes include the required YouTube scope.
9. Backend stores tokens encrypted.
10. Backend stores account/channel identity when available.
11. Backend redirects the user back to Platform Settings.

Denied consent:

- If Google returns an OAuth error, do not create/update account tokens.
- Redirect back to UI with a safe error state.
- Log only non-sensitive error metadata.

Expired or revoked tokens:

- Refresh access token using encrypted refresh token.
- If refresh fails with invalid grant/revocation, mark account `needs_reauth` or `revoked`.
- UI should prompt reconnect.

Never log:

- Authorization code.
- Access token.
- Refresh token.
- ID token.
- Raw token exchange response.

## 7. Scopes

Recommended MVP scope:

- `https://www.googleapis.com/auth/youtube.upload`

This scope is narrower and maps to managing/uploading YouTube videos. It is also accepted for `thumbnails.set`.

Broader scopes to avoid initially:

- `https://www.googleapis.com/auth/youtube`
- `https://www.googleapis.com/auth/youtube.force-ssl`

Tradeoff:

- `youtube.upload` is better for least privilege and consent clarity.
- `youtube.force-ssl` or `youtube` may be needed later if the app needs broader edit/delete/comment/caption actions.
- Do not request broader scopes unless a specific API operation requires them.

## 8. Upload/Schedule Flow

Backend flow for manual YouTube upload/schedule trigger:

1. Authenticate user.
2. Verify user owns the target `PlatformPost`.
3. Verify `PlatformPost.platform === "youtube"`.
4. Block if `platformPostUrl` already exists unless explicit retry/recover mode is added.
5. Verify `PlatformPost.title` exists.
6. Use `PlatformPost.description` and `PlatformPost.tags`.
7. Find a `MediaAsset` with `type === "video"` for the same `ContentItem`.
8. Optionally find a `MediaAsset` with `type === "thumbnail"`.
9. Verify the local file exists under `UPLOAD_DIR` via `storageKey`.
10. Verify YouTube account is connected and tokens can be refreshed.
11. Create or update logging state for the upload attempt.
12. Upload video with `videos.insert`, setting snippet/status metadata.
13. If a thumbnail exists, call `thumbnails.set` for the returned `videoId`.
14. If scheduling is requested and `Schedule.scheduledAt` is in the future, set `status.publishAt` and `privacyStatus=private`.
15. Save YouTube watch URL into `platformPostUrl`.
16. Prefer also saving `externalVideoId` after schema support exists.
17. Update `PlatformPost` and `Schedule` statuses.
18. Record `PublishAttempt` success/failure with safe response metadata.

Current enum gap:

- `PublishAttemptStatus` currently has `success`, `failed`, `skipped`, `manual_completed`, and `cancelled`.
- It lacks `processing` or `started`.
- For MVP, create the `PublishAttempt` at the end with `success` or `failed`.
- For better auditability, add a later enum value such as `processing` or `started` before implementing long uploads.

Current `ScheduleStatus` already includes `processing`, so a YouTube schedule can temporarily move to `processing` during upload if that is useful.

## 9. Scheduling Strategy

Option A: Upload immediately as private with `publishAt`.

- User clicks "Upload/Schedule to YouTube".
- Backend uploads the video now.
- If scheduled for the future, backend sends `status.publishAt` and `privacyStatus=private`.
- YouTube handles publication time.

Option B: Worker uploads near scheduled time.

- App keeps local file until near `scheduledAt`.
- Worker finds due `auto` schedules and uploads then.

Implemented MVP approach: both paths exist.

- Manual upload supports immediate upload and YouTube `publishAt` for valid future private schedules.
- Scheduled worker upload supports due local `auto` schedules and uploads near `scheduledAt`.
- Manual fallback remains available.
- The worker is disabled by default and should be enabled only when intentionally processing due auto uploads.

Risks:

- Unverified projects created after July 28, 2020 may have uploads restricted to private until audit/compliance review.
- Manual scheduled uploads consume quota earlier because they upload immediately.
- Worker uploads consume quota when due schedules are processed.
- Retrying after partial failure requires idempotency handling.
- If video files are deleted locally after upload, retries may not be possible, but YouTube already has the uploaded video.

## 10. Worker / Job Strategy

Implemented path:

1. Manual "Upload/Schedule to YouTube" action from the YouTube `PlatformPost`.
2. Scheduled in-process worker for due YouTube `auto` schedules.
3. Record result in `PublishAttempt`.
4. Keep manual completion fallback.

Worker behavior:

- Worker is disabled by default.
- Worker finds due YouTube `auto` schedules with `status=scheduled`, `scheduledAt <= now`, retry due, and `platformPostUrl = null`.
- Worker claims schedules by moving them to `processing`.
- Stale recovery is scoped to YouTube `auto` processing schedules where `platformPostUrl = null`.
- Upload code still blocks duplicates if `platformPostUrl` exists or the platform post is already complete.

Operational runbook:

```text
docs/operations/youtube-auto-upload-worker.md
```

## 11. Failure Handling

OAuth expired:

- Attempt refresh.
- If refresh succeeds, continue.
- If refresh fails, mark account `needs_reauth`, record failed `PublishAttempt`, show reconnect UI.

OAuth revoked:

- Mark account `revoked` or `needs_reauth`.
- Record failed `PublishAttempt`.
- Do not retry until reconnect.

Quota exceeded:

- Record failed `PublishAttempt` with sanitized quota error.
- Leave `PlatformPost` not published.
- Show clear UI error and keep manual fallback.

Missing video:

- Return `422`.
- Record failed attempt if upload was explicitly triggered.
- UI should ask user to upload a video asset first.

Missing title:

- Return `422`.
- Use existing YouTube composer validation.

Invalid thumbnail:

- If video upload succeeded but thumbnail failed, keep the video URL and record a warning/failure detail.
- Do not retry full video upload just for thumbnail failure.
- Provide later "retry thumbnail" or manual YouTube Studio fallback.

Upload failed:

- Record failed `PublishAttempt`.
- Keep `PlatformPost.status` as `ready` or set `failed` depending on UX decision.
- Do not set `platformPostUrl` unless YouTube returned a usable `videoId`.

Invalid or past `publishAt`:

- If schedule is in the past, either upload as private now without `publishAt`, or fail with clear validation.
- Recommended MVP: fail with `422` unless user explicitly chooses "Upload now".

Unverified app private-only restriction:

- Warn in UI and docs that uploads may stay private until Google/YouTube audit/compliance review.
- Default upload privacy to `private`.
- Do not promise public scheduling until the Google project status is understood.

## 12. Idempotency / Duplicate Protection

MVP protections:

- Block upload if `platformPostUrl` already exists.
- Block upload if `PlatformPost.status` is already `published` or `manual_done`.
- Use one explicit upload action at a time from UI.

Recommended schema support:

- Add `externalVideoId` on `PlatformPost`, or an `ExternalPublish`/`PlatformPublish` record keyed by platform post.
- Store the returned YouTube `videoId` immediately after `videos.insert` succeeds.

Partial failure cases:

- If video upload succeeds but thumbnail or DB update fails, the app needs a recovery path.
- `responsePayload` in `PublishAttempt` should store sanitized YouTube IDs/status, not tokens.
- A retry should first check `externalVideoId`/`platformPostUrl` to avoid duplicate uploads.

Avoid treating multiple `PublishAttempt` rows as permission to upload multiple videos for the same platform post.

## 13. Frontend UX Plan

Concept only; do not implement in this phase.

Platform Settings:

- Show YouTube connected/disconnected status.
- Add "Connect YouTube".
- Add "Disconnect".
- Show connected channel/account name.
- Show `needs_reauth` state when token refresh fails.

YouTube composer:

- Show YouTube connection status.
- Show "Upload/Schedule to YouTube" action.
- Disable action until title and video asset exist.
- Show warning about unverified API project private-only restriction.
- Show latest `PublishAttempt` success/failure.
- Show uploaded YouTube URL when available.
- Keep manual completion fallback available.

Publish logs:

- Display YouTube upload failures with sanitized messages.
- Do not display tokens or raw OAuth responses.

## 14. Security Checklist

Reference:

```text
docs/operations/security-checklist.md
```

Required before storing OAuth tokens:

- Encrypt stored access and refresh tokens.
- Use `TOKEN_ENCRYPTION_KEY`.
- Keep OAuth client secret in env/Coolify only.
- Never log tokens, authorization codes, or raw token responses.
- Use OAuth `state` to prevent CSRF.
- Use separate local and production redirect URIs.
- Confirm production redirect URI before adding Google console config.
- Plan token rotation/disconnect.
- Back up `TOKEN_ENCRYPTION_KEY` securely outside the database.

## 15. Backup/Recovery Implications

After OAuth token storage is added:

- PostgreSQL backups will contain encrypted OAuth tokens.
- `TOKEN_ENCRYPTION_KEY` must be backed up securely outside the database.
- Losing `TOKEN_ENCRYPTION_KEY` makes stored OAuth tokens unusable.
- Restoring the database without the matching encryption key will require reconnecting YouTube.
- Disaster recovery drills should include YouTube account status checks.
- Backup docs should be updated once token storage exists.

Uploads remain important:

- The YouTube upload service depends on local video files under `UPLOAD_DIR` until the upload succeeds.
- Restore must keep database and uploads aligned, as documented in existing backup/disaster recovery runbooks.

## 16. API Design Draft

Draft only; no implementation in this phase.

### GET `/api/v1/integrations/youtube/connect`

Starts OAuth.

Response:

- `302` redirect to Google consent, or
- `200` with `{ success: true, data: { authorizationUrl } }` if frontend-driven redirect is preferred.

Errors:

- `401` unauthenticated.
- `500` missing OAuth env config.

### GET `/api/v1/integrations/youtube/callback`

Handles Google OAuth callback.

Query:

- `code`
- `state`
- `error` optional

Behavior:

- Validate state.
- Exchange code.
- Store encrypted tokens.
- Redirect to frontend Platform Settings.

Errors:

- `400` invalid/missing state.
- `400` denied consent.
- `500` token exchange/storage failure.

### GET `/api/v1/integrations/youtube/status`

Returns connection status.

Response shape:

```json
{
  "success": true,
  "data": {
    "platform": "youtube",
    "connected": true,
    "status": "connected",
    "accountName": "JoSam Code",
    "accountId": "UC...",
    "scopes": ["https://www.googleapis.com/auth/youtube.upload"],
    "connectedAt": "2026-05-15T00:00:00.000Z",
    "lastError": null
  }
}
```

Errors:

- `401` unauthenticated.

### DELETE `/api/v1/integrations/youtube/disconnect`

Disconnects YouTube.

Behavior:

- Revoke token at Google if possible.
- Delete or mark stored account tokens revoked.

Response:

```json
{
  "success": true,
  "message": "YouTube disconnected successfully"
}
```

Errors:

- `401` unauthenticated.

### POST `/api/v1/platform-posts/:id/youtube/upload`

Manual upload/schedule trigger.

Request body:

```json
{
  "scheduleId": "optional",
  "privacyStatus": "private",
  "categoryId": "optional"
}
```

Response shape:

```json
{
  "success": true,
  "message": "YouTube upload completed",
  "data": {
    "platformPostId": "post_id",
    "videoId": "youtube_video_id",
    "platformPostUrl": "https://www.youtube.com/watch?v=...",
    "publishAttemptId": "attempt_id",
    "scheduleStatus": "published"
  }
}
```

Errors:

- `401` unauthenticated.
- `404` platform post not found.
- `409` already uploaded.
- `422` not YouTube, missing title, missing video, invalid schedule, or disconnected account.
- `429` quota/rate limit where applicable.
- `502`/`503` upstream YouTube API failure.

## 17. Implementation Roadmap

- Done: schema/env/token encryption foundation.
- Done: YouTube OAuth connect/status/disconnect backend.
- Done: Platform Settings YouTube connect UI.
- Done: YouTube upload service manual trigger backend.
- Done: YouTube composer upload/schedule UI.
- Done: PublishAttempt/failure polish.
- Done: scheduled worker retry fields.
- Done: scheduled YouTube worker MVP.
- Done: stale recovery safety fix.
- Done: controlled production activation success.
- Future: continuous always-on worker operation.
- Future: richer frontend worker state.
- Future: `externalVideoId`.
- Future: analytics.
- Future: Meta/TikTok integrations.

## 18. Open Questions / Risks

Decide before coding:

- Exact local callback URL.
- Exact production callback URL.
- Final OAuth scope: start with `youtube.upload` unless testing proves broader scope is required.
- Default YouTube `categoryId`.
- Whether to upload immediately with `publishAt` or upload at scheduled time.
- Whether to add `externalVideoId` to `PlatformPost`.
- Whether to add `processing` to `PublishAttemptStatus`.
- Whether `PlatformAccount` should be generic for all platforms or YouTube-specific first.
- How to store OAuth `state` without adding a heavyweight session dependency.
- How UI should represent unverified API project private-only restriction.
- How to recover after video upload succeeds but thumbnail or DB update fails.
- How to handle upload cancellation/timeouts for large local files.
- Whether to preserve local uploaded video after successful YouTube upload.

## References

- YouTube Data API `videos.insert`: https://developers.google.com/youtube/v3/docs/videos/insert
- YouTube Data API videos resource and `status.publishAt`: https://developers.google.com/youtube/v3/docs/videos
- YouTube Data API `thumbnails.set`: https://developers.google.com/youtube/v3/docs/thumbnails/set
- YouTube OAuth for server-side web apps and scopes: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
- YouTube Data API quota and compliance audits: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits
