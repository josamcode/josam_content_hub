const nodemailer = require("nodemailer");

const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const notificationService = require("../notifications/notification.service");
const {
  testEmailTemplate,
  notificationEventTemplate,
} = require("./email.templates");

function getSafeErrorMessage(error) {
  if (!error) return "Email send failed";
  if (typeof error.message === "string") return error.message.slice(0, 300);
  return "Email send failed";
}

function getMissingConfigFields() {
  const missing = [];

  if (!env.emailFrom) missing.push("EMAIL_FROM");
  if (!env.smtpHost) missing.push("SMTP_HOST");
  if (!env.smtpPort) missing.push("SMTP_PORT");
  if (!env.smtpUser) missing.push("SMTP_USER");
  if (!env.smtpPass) missing.push("SMTP_PASS");

  return missing;
}

function isEmailConfigured() {
  return env.emailEnabled && getMissingConfigFields().length === 0;
}

function assertEmailConfigured() {
  if (!env.emailEnabled) {
    return {
      configured: false,
      skipped: true,
      reason: "email_disabled",
    };
  }

  const missing = getMissingConfigFields();

  if (missing.length > 0) {
    throw new ApiError(
      503,
      "Email is enabled but SMTP configuration is incomplete",
      {
        missing,
      }
    );
  }

  return {
    configured: true,
    skipped: false,
    reason: null,
  };
}

function createTransport() {
  const configState = assertEmailConfigured();

  if (configState.skipped) {
    throw new ApiError(503, "Email is disabled");
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  const configState = assertEmailConfigured();

  if (configState.skipped) {
    return {
      status: "skipped",
      reason: configState.reason,
    };
  }

  const recipient = to || env.emailTo;

  if (!recipient) {
    throw new ApiError(422, "Email recipient is required");
  }

  try {
    const transport = createTransport();
    const info = await transport.sendMail({
      from: env.emailFrom,
      to: recipient,
      subject,
      text,
      html,
    });

    return {
      status: "sent",
      messageId: info.messageId || null,
    };
  } catch (error) {
    console.error(`Email send failed: ${getSafeErrorMessage(error)}`);
    return {
      status: "failed",
      reason: getSafeErrorMessage(error),
    };
  }
}

async function sendTestEmail(to) {
  const template = testEmailTemplate({
    appName: "JoSam Content Hub",
    timestamp: new Date().toISOString(),
  });

  return sendMail({
    to,
    subject: "JoSam Content Hub SMTP test",
    text: template.text,
    html: template.html,
  });
}

async function sendNotificationEventEmail(event, to) {
  const configState = assertEmailConfigured();

  if (configState.skipped) {
    await notificationService.markEmailSkipped(event.id, configState.reason);
    return {
      status: "skipped",
      reason: configState.reason,
    };
  }

  const template = notificationEventTemplate(event);
  const result = await sendMail({
    to,
    subject: `[JoSam Content Hub] ${event.title}`,
    text: template.text,
    html: template.html,
  });

  if (result.status === "sent") {
    await notificationService.markEmailSent(event.id);
  } else if (result.status === "skipped") {
    await notificationService.markEmailSkipped(event.id, result.reason);
  } else {
    await notificationService.markEmailFailed(event.id, result.reason);
  }

  return result;
}

module.exports = {
  createTransport,
  isEmailConfigured,
  sendMail,
  sendTestEmail,
  sendNotificationEventEmail,
};
