# Meta (Facebook/Instagram) Integration Technical Design

## 1. Goal

Add Facebook Page and Instagram Professional account publishing through official Meta APIs, reusing the existing `PlatformAccount`, token encryption, `PublishAttempt`, and scheduling infrastructure from the YouTube integration.

Initial goal:

- Connect one Facebook Page for the private user via Meta OAuth.
- Optionally connect the linked Instagram Professional account.
- Publish Facebook Page posts and Instagram media using existing `ContentItem`, `PlatformPost`, `Schedule`, and `MediaAsset` data.
- Reuse the `platformPostUrl` and `PublishAttempt` logging patterns from YouTube.
- Keep manual publishing fallback available.

This is the second official API integration after YouTube. TikTok is planned separately.

## Implementation Status

Completed:

- Token encryption foundation with `TOKEN_ENCRYPTION_KEY`.
- `PlatformAccount` model with per-platform accounts, scopes, and status.
- `PublishAttempt` logging with platform, mode, status, and safe error messages.
- Scheduled worker infrastructure pattern from YouTube.

Current phase (21B):

- Meta env configuration placeholders.
- Meta integration technical design doc (this file).
- No OAuth, no services, no UI yet.

Next phases: 21C (PlatformAccount metadata schema), 21D (Meta OAuth backend), 21E (Meta connect UI), 21F (Facebook publish), 21G (Instagram publish), 21H (frontend publish panels), 21I (Meta worker), 21J (controlled production test).

## 2. Non-goals

This integration does not include:

- TikTok integration.
- Multi-Facebook-page or multi-Instagram-account management.
- Team workflows or per-team OAuth.
- Ad account or Page insights/analytics import.
- Facebook Group publishing.
- Instagram Stories publishing and advanced Reels options are not included initially. Initial Instagram publishing will target the simplest officially supported media/reel flow after verification from current Meta docs.
- Comment/reply management.
- Scraping, browser automation, or unofficial APIs.

## 3. Meta Developer Setup Requirements

Before implementing Meta OAuth, the following must be set up in the Meta Developer dashboard:

- A Meta Developer account.
- A Meta App configured for the desired use case.
- Facebook Login product configured with valid OAuth redirect URIs.
- A Facebook Page owned or managed by the developer account.
- An Instagram Professional account (Business or Creator) linked to that Facebook Page.

Instagram publishing requires the Instagram account to be linked to a Facebook Page. A standalone Instagram account without a linked Facebook Page cannot be published to through the official API.

## 4. OAuth Redirect URIs

Local development:

```
http://localhost:5000/api/v1/integrations/meta/callback
```

Production:

```
https://api-content.josamcode.com/api/v1/integrations/meta/callback
```

These must be registered in the Meta App dashboard under Facebook Login settings.

## 5. Likely Permissions / Scopes

Verify from current Meta docs before implementation. The following are likely required based on current Meta Graph API documentation:

Facebook Page access:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`

Instagram access:

- `instagram_basic`
- `instagram_content_publish`

Additional if Business Manager scope is needed:

- `business_management` (verify from current Meta docs before requesting)

Do not request permissions the app does not use. Meta App Review may require a screen recording and detailed justification for each permission.

## 6. Architecture Plan

Reuse existing infrastructure:

- **PlatformAccount**: The existing model supports multiple platforms via the `platform` enum. Meta accounts will create `PlatformAccount` records with `platform = "facebook"` (for the Page) and `platform = "instagram"` (for the Instagram Professional account).
- **Token encryption**: Meta access tokens will be encrypted with the existing `TOKEN_ENCRYPTION_KEY` before storage.
- **PublishAttempt**: Facebook and Instagram publish attempts will use the same `PublishAttempt` model with `platform = "facebook"` or `platform = "instagram"`.
- **Scheduled worker pattern**: The Meta auto-upload worker will follow the same in-process pattern as the YouTube worker, disabled by default.

New pieces needed:

- Meta OAuth backend (connect/callback/status/disconnect endpoints).
- Facebook Page publish service.
- Instagram media publish service (container + publish flow).
- Meta auto-upload worker.
- Frontend Meta connect UI and publish panels.

## 7. Facebook Page Publishing Flow (Conceptual)

1. User must be authenticated.
2. Verify user owns the target `PlatformPost` with `platform = "facebook"`.
3. Verify Facebook Page account is connected and tokens can be refreshed.
4. Block if `platformPostUrl` already exists (duplicate protection).
5. Upload media (photo/video) to the Facebook Page.
6. Create a Facebook Page post with the uploaded media and `PlatformPost` text.
7. Save the Facebook post URL to `platformPostUrl`.
8. Record `PublishAttempt` success or failure.

Facebook Page posts can include text, photos, and videos. Video uploads may be asynchronous and require polling for completion. Verify current behavior from Meta docs.

## 8. Instagram Publishing Flow (Conceptual)

Instagram Content Publishing API uses a two-step container flow:

1. Create a media container (`POST /{ig-user-id}/media`) with the image/video URL, caption, and other metadata.
2. Publish the container (`POST /{ig-user-id}/media_publish`) when the container status is `FINISHED`.
3. For video, the container may take longer to process; poll the container status endpoint.
4. Save the Instagram post permalink to `platformPostUrl`.
5. Record `PublishAttempt` success or failure.

Instagram requires the media to be hosted at a publicly accessible URL. See section 10.

## 9. Meta Auto-Upload Worker (Conceptual)

Follows the YouTube worker pattern:

- In-process worker, disabled by default (`META_AUTO_UPLOAD_WORKER_ENABLED=false`).
- Finds due `auto` schedules with `platform = "facebook"` or `platform = "instagram"`.
- Processes Facebook and Instagram uploads separately.
- Claims schedules, records attempts, handles retries.
- Stale recovery for `processing` schedules.

Runbook will be created in `docs/operations/meta-auto-upload-worker.md` when the worker is implemented.

## 10. Public Media URL Requirement

Meta's Instagram Content Publishing API and Facebook video uploads require media to be accessible at a public URL.

Current state:

- Production uploads are served from `https://api-content.josamcode.com/uploads`.
- These URLs are publicly accessible and may satisfy Meta's requirements.
- However, this exposes uploaded media publicly without authentication.

Risks:

- Public media URLs mean anyone who knows or guesses the URL can access uploaded files.
- This is acceptable for public social media content but may be a concern for unpublished/draft media.

Future improvements:

- Cloudflare R2 or S3 with signed URLs for temporary public access.
- Time-limited signed URLs that expire after the publish window.
- Cleanup of temporary public URLs after successful publish.

Do not block the initial Meta integration on this. The current public URL setup is likely sufficient for a controlled private deployment.

## 11. PlatformAccount Metadata Schema (Phase 21C)

Additional fields likely needed on `PlatformAccount` for Meta:

- Page ID, Page name, Page access token (Facebook).
- Instagram Business Account ID, username (Instagram).
- Token type (short-lived vs long-lived).
- Token refresh metadata.

Exact schema to be designed in phase 21C. Do not modify Prisma schema in phase 21B.

## 12. Environment Variables

All Meta env vars are optional. Missing values will not break backend startup.

OAuth:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_OAUTH_SUCCESS_REDIRECT_URL`
- `META_OAUTH_ERROR_REDIRECT_URL`

Scheduled worker:

- `META_AUTO_UPLOAD_WORKER_ENABLED` (default `false`)
- `META_AUTO_UPLOAD_WORKER_INTERVAL_MS` (default `60000`)
- `META_AUTO_UPLOAD_WORKER_BATCH_SIZE` (default `1`)
- `META_AUTO_UPLOAD_WORKER_MAX_ATTEMPTS` (default `3`)

## 13. Security Checklist

Before implementing Meta OAuth:

- [ ] Never expose Meta tokens to the frontend.
- [ ] Encrypt all stored Meta access tokens with `TOKEN_ENCRYPTION_KEY`.
- [ ] Never log raw token responses, authorization codes, or access tokens.
- [ ] Use OAuth `state` parameter to prevent CSRF on the callback.
- [ ] Keep `META_APP_SECRET` in env/Coolify only; never commit it.
- [ ] Use separate local and production redirect URIs configured in the Meta App dashboard.
- [ ] Validate granted scopes against expected scopes on callback.
- [ ] Handle denied consent safely without creating partial account records.
- [ ] Sanitize error messages returned to the frontend.
- [ ] Back up `TOKEN_ENCRYPTION_KEY` securely outside the database.
- [ ] Do not store raw Meta API response payloads in `PublishAttempt.responsePayload`.

## 14. Safe Phased Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 21B | Docs, env placeholders, developer setup prep | In progress |
| 21C | PlatformAccount metadata schema for Meta | Planned |
| 21D | Meta OAuth backend (connect/callback/status/disconnect) | Planned |
| 21E | Meta connect UI (Platform Settings) | Planned |
| 21F | Facebook manual publish backend | Planned |
| 21G | Instagram manual publish backend | Planned |
| 21H | Frontend publish panels for Facebook/Instagram | Planned |
| 21I | Meta auto-upload worker | Planned |
| 21J | Controlled production test | Planned |

Each phase builds on the previous one. Do not skip phases. Do not implement OAuth before the schema is in place. Do not implement the worker before manual publish is verified.

## 15. Open Questions

Resolve before phase 21D:

- Exact Meta OAuth scopes to request (verify from current Meta docs).
- Whether long-lived token exchange should happen at connect time or on first use.
- Whether Instagram publishing requires the Facebook Page token or a separate Instagram token.
- How to handle token expiry for long-lived Meta tokens (typically 60 days).
- Whether to store page-level tokens or exchange user tokens per-request.
- How to handle the case where a user has multiple Facebook Pages.

## References

- Meta Graph API overview: https://developers.facebook.com/docs/graph-api/overview
- Facebook Login for servers: https://developers.facebook.com/docs/facebook-login/guides/access-tokens
- Facebook Page API (posts): https://developers.facebook.com/docs/pages/publishing
- Instagram Graph API (content publishing): https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- Instagram media container status: https://developers.facebook.com/docs/instagram-api/reference/ig-media
- Meta long-lived access tokens: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/long-lived
- Meta App Review: https://developers.facebook.com/docs/app-review
