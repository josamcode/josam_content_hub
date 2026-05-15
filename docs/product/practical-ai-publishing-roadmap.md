# Practical AI Publishing Roadmap

## Product Direction

JoSam Content Hub is moving toward practical AI-assisted publishing, not a generic content OS.

The target workflow is:

1. Upload one video.
2. Write one idea or prompt.
3. Generate platform-specific metadata with AI.
4. Review and apply the generated metadata.
5. Choose exact publish dates and times manually per video and platform.
6. Auto-publish where official platform APIs allow it.
7. Receive useful email updates for important publishing, OAuth, media, and worker events.

The fastest useful path is preferred. Features should be scoped around real publishing work, not broad planning UI or low-value polish.

## What Is Already Done

- Production backend at `https://api-content.josamcode.com`.
- Production frontend at `https://content.josamcode.com`.
- Auth.
- Content items.
- Platform posts.
- Media upload.
- Scheduling and calendar.
- Reminders.
- Publish logs.
- Platform settings.
- YouTube OAuth.
- Manual YouTube upload.
- Scheduled YouTube worker.
- Worker runbook and operational docs.

## Explicit Decisions

- No separate bulk upload page for now. Uploading videos one by one is acceptable and avoids unnecessary complexity.
- Emails should use NodeMailer with SMTP, not Resend or SendGrid as the default.
- Email sending must be best-effort and must not break core publishing flows.
- Uploaded media stays on the Coolify persistent volume for now.
- Cloudflare R2/S3 migration is not a current priority.
- Scheduling stays manually controlled by the user.
- The next scheduling improvement should be a Schedule Matrix inside Content Details, not automatic bulk calendar distribution.
- TikTok official API integration is feasible and worth pursuing after the core practical automation steps.
- Use official platform APIs only.
- Do not use scraping, browser automation, or unofficial publishing hacks.

## Updated Phase Plan

### Phase 12 - NotificationEvent Foundation

- Record important activity events first.
- No email yet.
- Events for publishing, scheduling, OAuth, AI, media, and worker issues.

### Phase 13 - NodeMailer SMTP Email System

- Add SMTP env config.
- Add professional email templates.
- Send emails best-effort.
- Keep secrets, tokens, and raw OAuth data out of emails.

### Phase 14 - Hook Emails into YouTube Flow

- YouTube manual upload success/failure.
- YouTube scheduled worker success/failure.
- YouTube needs re-auth.
- Align `PublishAttempt` and `NotificationEvent`.

### Phase 15 - Media Library / Server Media Manager

- List all media assets.
- Show storage summary.
- Delete unused media.
- Detect missing, deleted, and orphan files.
- Make Content Details handle deleted or missing media clearly.

### Phase 16 - AI Brand Profile

- Audience.
- Tone.
- Language.
- CTA style.
- Forbidden words.
- Hashtag bank.
- Platform-specific instructions.

### Phase 17 - AI Metadata Backend

- Generate platform metadata from one idea.
- Return strict JSON.
- Validate with Zod.
- Record attempt logs.
- Never auto-overwrite existing metadata.

### Phase 18 - AI Metadata UI

- Add the idea field inside Content Details.
- Generate metadata.
- Preview generated results.
- Apply empty fields.
- Overwrite existing fields only with confirmation.

### Phase 19 - Schedule Matrix

- Schedule all or specific platforms from one place.
- User chooses exact date/time.
- Optional offset between platforms.
- Save all schedules once.
- Show conflict warnings.

### Phase 20 - Monthly Planning View

- Planning view, not bulk upload.
- Show unscheduled, scheduled, published, and failed content.
- Quick schedule or open content.

### Phase 21 - Meta Integration

- Meta planning.
- Meta connect.
- Facebook publish.
- Instagram publish where supported.

### Phase 22 - TikTok Official Integration

- TikTok app/API research.
- OAuth connect.
- Direct post/upload proof of concept.
- Publish logs and emails.
- Worker integration if supported.

### Phase 23 - Publishing Control Center

- Due posts.
- Failed posts.
- Needs re-auth.
- Retry, open content, and view logs.

### Phase 24 - Analytics Foundation

- Manual metrics first.
- API analytics later.

## First Execution Sprint

Recommended first six execution steps:

1. NotificationEvent foundation.
2. NodeMailer SMTP.
3. YouTube email alerts.
4. Media Library backend.
5. Media Library UI.
6. AI Brand Profile.
