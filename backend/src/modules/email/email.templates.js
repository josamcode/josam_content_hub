const APP_NAME = "JoSam Content Hub";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createBaseLayout({ title, bodyHtml, bodyText }) {
  const safeTitle = escapeHtml(title);

  return {
    text: bodyText,
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f6f7f9;color:#1f2933;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#64748b;">${APP_NAME}</p>
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111827;">${safeTitle}</h1>
        ${bodyHtml}
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#64748b;">This is an automated notification from ${APP_NAME}.</p>
    </div>
  </body>
</html>`,
  };
}

function testEmailTemplate({ appName = APP_NAME, timestamp }) {
  const sentAt = timestamp || new Date().toISOString();
  const title = "SMTP test email";
  const bodyText = `${appName} SMTP test email\n\nSent at: ${sentAt}`;
  const bodyHtml = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">SMTP email delivery is configured for ${escapeHtml(appName)}.</p>
        <p style="margin:0;font-size:14px;color:#475569;">Sent at: ${escapeHtml(sentAt)}</p>`;

  return createBaseLayout({ title, bodyHtml, bodyText });
}

function notificationEventTemplate(event) {
  const title = event.title || "Notification event";
  const payload =
    event.payload && typeof event.payload === "object" ? event.payload : {};
  const isYouTubeEvent =
    event.type === "youtube_upload_success" ||
    event.type === "youtube_upload_failed";
  const status = payload.status || (event.severity === "error" ? "failed" : "success");
  const nextAction =
    payload.nextAction ||
    (payload.errorMessage &&
    /reconnect|authorization|auth|token/i.test(payload.errorMessage)
      ? "Reconnect YouTube from Platform Settings."
      : payload.errorMessage &&
          /title|media|video|file|required|validation/i.test(
            payload.errorMessage
          )
        ? "Check the content title and uploaded video media, then try again."
        : payload.errorMessage
          ? "Check Publish Logs for details before retrying."
          : null);
  const lines = [
    title,
    "",
    event.message || "A notification event was recorded.",
    "",
    payload.contentTitle ? `Content: ${payload.contentTitle}` : null,
    payload.platform ? `Platform: ${payload.platform}` : null,
    payload.status || isYouTubeEvent ? `Status: ${status}` : null,
    payload.publishMode ? `Mode: ${payload.publishMode}` : null,
    payload.platformPostUrl ? `URL: ${payload.platformPostUrl}` : null,
    payload.errorMessage ? `Error: ${payload.errorMessage}` : null,
    nextAction ? `Next action: ${nextAction}` : null,
    `Type: ${event.type}`,
    `Severity: ${event.severity}`,
    event.entityType ? `Entity: ${event.entityType}${event.entityId ? ` ${event.entityId}` : ""}` : null,
    `Created at: ${event.createdAt ? new Date(event.createdAt).toISOString() : new Date().toISOString()}`,
  ].filter(Boolean);

  const bodyHtml = `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${escapeHtml(
          event.message || "A notification event was recorded."
        )}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;color:#334155;">
          ${
            payload.contentTitle
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Content</td><td style="padding:6px 0;">${escapeHtml(payload.contentTitle)}</td></tr>`
              : ""
          }
          ${
            payload.platform
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Platform</td><td style="padding:6px 0;">${escapeHtml(payload.platform)}</td></tr>`
              : ""
          }
          ${
            payload.status || isYouTubeEvent
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Status</td><td style="padding:6px 0;">${escapeHtml(status)}</td></tr>`
              : ""
          }
          ${
            payload.publishMode
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Mode</td><td style="padding:6px 0;">${escapeHtml(payload.publishMode)}</td></tr>`
              : ""
          }
          ${
            payload.platformPostUrl
              ? `<tr><td style="padding:6px 0;font-weight:bold;">URL</td><td style="padding:6px 0;"><a href="${escapeHtml(payload.platformPostUrl)}">${escapeHtml(payload.platformPostUrl)}</a></td></tr>`
              : ""
          }
          ${
            payload.errorMessage
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Error</td><td style="padding:6px 0;">${escapeHtml(payload.errorMessage)}</td></tr>`
              : ""
          }
          ${
            nextAction
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Next action</td><td style="padding:6px 0;">${escapeHtml(nextAction)}</td></tr>`
              : ""
          }
          <tr><td style="padding:6px 0;font-weight:bold;">Type</td><td style="padding:6px 0;">${escapeHtml(event.type)}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold;">Severity</td><td style="padding:6px 0;">${escapeHtml(event.severity)}</td></tr>
          ${
            event.entityType
              ? `<tr><td style="padding:6px 0;font-weight:bold;">Entity</td><td style="padding:6px 0;">${escapeHtml(event.entityType)}${event.entityId ? ` ${escapeHtml(event.entityId)}` : ""}</td></tr>`
              : ""
          }
          <tr><td style="padding:6px 0;font-weight:bold;">Created</td><td style="padding:6px 0;">${escapeHtml(
            event.createdAt
              ? new Date(event.createdAt).toISOString()
              : new Date().toISOString()
          )}</td></tr>
        </table>`;

  return createBaseLayout({
    title,
    bodyHtml,
    bodyText: lines.join("\n"),
  });
}

module.exports = {
  createBaseLayout,
  testEmailTemplate,
  notificationEventTemplate,
};
