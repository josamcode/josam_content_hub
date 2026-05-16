const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const notificationService = require("../notifications/notification.service");
const emailService = require("./email.service");
const {
  testEmailSchema,
  idParamsSchema,
} = require("./email.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid id");
  }

  return parsedParams.data;
}

async function sendTestEmail(req, res) {
  const parsedBody = testEmailSchema.safeParse(req.body || {});

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid email test data");
  }

  const data = await emailService.sendTestEmail(parsedBody.data.to);

  return successResponse(res, 200, "Email test processed", data);
}

async function sendNotificationEventEmail(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = testEmailSchema.safeParse(req.body || {});

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid email data");
  }

  const event = await notificationService.getNotificationEvent(req.user.id, id);
  const data = await emailService.sendNotificationEventEmail(
    event,
    parsedBody.data.to
  );

  return successResponse(res, 200, "Notification email processed", data);
}

module.exports = {
  sendTestEmail,
  sendNotificationEventEmail,
};
