const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const publishingService = require("./publishing.service");
const {
  manualCompleteSchema,
  publishAttemptsQuerySchema,
} = require("./publishing.validation");

async function manualComplete(req, res) {
  const parsedBody = manualCompleteSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid manual publish data");
  }

  const data = await publishingService.manualComplete(
    req.user.id,
    parsedBody.data
  );

  return successResponse(
    res,
    200,
    "Manual publish marked as completed",
    data
  );
}

async function listPublishAttempts(req, res) {
  const parsedQuery = publishAttemptsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid publish attempt filters");
  }

  const result = await publishingService.listPublishAttempts(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

module.exports = {
  manualComplete,
  listPublishAttempts,
};
