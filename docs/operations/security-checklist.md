# Security Checklist Before YouTube Integration

## Purpose

This checklist captures the small security hardening required before adding OAuth or YouTube publishing features. It is not a full auth redesign.

Current state:

- Backend uses JWT login.
- Frontend stores the JWT client-side.
- The app is a private MVP.
- OAuth tokens are not implemented yet.

## Login Rate Limiting

`POST /api/v1/auth/login` is rate-limited.

Defaults:

- `AUTH_RATE_LIMIT_WINDOW_MS=900000`
- `AUTH_RATE_LIMIT_MAX=10`

The limiter returns HTTP `429` with the existing JSON error style:

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later."
}
```

This is in-memory rate limiting, which is acceptable for the current single-instance MVP. If the backend is scaled to multiple instances, move rate limiting to a shared store such as Redis.

## Seed And Password Safety

The seed script should run intentionally, not on every production deploy.

Important behavior:

- `backend/prisma/seed.js` upserts the private user by `SEED_USER_EMAIL`.
- Rerunning seed with the same email updates the user's name and password hash.
- That means rerunning seed can reset the private user's password.

Production rules:

- Production seed credentials must come from secure environment variables in Coolify.
- Do not reuse example passwords from `.env.example`.
- Do not paste production seed credentials into committed files, shell snippets, issue comments, or logs.
- If seed was ever run with temporary or shared credentials, rotate the password immediately.
- Keep `npm run prisma:seed` as a first-bootstrap or intentional maintenance command only.

## JWT And LocalStorage Risk

Current JWT storage is acceptable for the private MVP, but it should be reviewed before OAuth tokens are introduced.

Risks and follow-up items:

- Client-side JWT storage is exposed to XSS if malicious script runs in the browser.
- Token lifetime should be reviewed before YouTube integration.
- Refresh/session strategy should be decided before storing third-party tokens.
- HTTP-only cookie sessions are a future improvement to consider.
- `JWT_SECRET` must be strong, production-only, and rotated if exposed.
- Logs must never print JWTs or Authorization headers.

Do not move auth to cookies in this phase. Treat this as a documented risk and revisit it before storing OAuth refresh tokens.

## OAuth Before YouTube Checklist

Before implementing YouTube OAuth:

- Store Google OAuth client ID and secret only in environment variables, Coolify, or Vercel project settings.
- Do not commit OAuth credentials.
- Decide how access and refresh tokens will be stored before writing token persistence code.
- Plan `TOKEN_ENCRYPTION_KEY` before storing refresh/access tokens.
- Encrypt stored OAuth tokens at rest.
- Minimize Google scopes to the smallest set required.
- Separate local callback URLs from production callback URLs.
- Document local callback URL.
- Document production callback URL.
- Confirm Vercel frontend URL and Coolify backend callback URL before Google console changes.
- Document Google app verification and audit risk.
- Confirm backups can restore encrypted tokens and the matching encryption key is handled securely.
- Never log OAuth authorization codes, access tokens, refresh tokens, ID tokens, or token exchange responses.
- Ensure error logs redact OAuth secrets and tokens.
- Add a rollback plan for failed OAuth deployment before enabling production callbacks.

## Pre-Integration Gate

Before starting YouTube integration, confirm:

1. Login rate limiting is deployed.
2. Production seed credentials are private and intentional.
3. `JWT_SECRET` is production-strong.
4. JWT/localStorage risk is accepted for the next phase or a session redesign is scheduled.
5. OAuth token encryption strategy is chosen.
6. Google OAuth redirect URLs are documented.
7. Backup and disaster recovery docs are current.
8. Read-only smoke verification works for production/staging.
