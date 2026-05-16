const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const notificationService = require("./notification.service");
const {
  notificationQuerySchema,
  idParamsSchema,
} = require("./notification.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid id");
  }

  return parsedParams.data;
}

async function listNotificationEvents(req, res) {
  const parsedQuery = notificationQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid notification filters");
  }

  const result = await notificationService.listNotificationEvents(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

async function getNotificationEvent(req, res) {
  const { id } = validateParams(req.params);
  const data = await notificationService.getNotificationEvent(req.user.id, id);

  return successResponse(res, 200, "Notification event retrieved", data);
}

async function markNotificationRead(req, res) {
  const { id } = validateParams(req.params);
  const data = await notificationService.markNotificationRead(req.user.id, id);

  return successResponse(res, 200, "Notification event marked as read", data);
}

module.exports = {
  listNotificationEvents,
  getNotificationEvent,
  markNotificationRead,
};
