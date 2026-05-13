const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const mediaService = require("./media.service");
const {
  uploadMediaSchema,
  listMediaQuerySchema,
  idParamsSchema,
} = require("./media.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid id");
  }

  return parsedParams.data;
}

async function uploadMedia(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = uploadMediaSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid media data");
  }

  const data = await mediaService.createMediaAsset(
    req.user.id,
    id,
    parsedBody.data,
    req.file
  );

  return successResponse(res, 201, "Media uploaded successfully", data);
}

async function ensureContentItemAccess(req, res, next) {
  const { id } = validateParams(req.params);

  await mediaService.verifyContentItemAccess(req.user.id, id);

  return next();
}

async function listMedia(req, res) {
  const { id } = validateParams(req.params);
  const parsedQuery = listMediaQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid media filters");
  }

  const data = await mediaService.listMediaAssets(
    req.user.id,
    id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data,
  });
}

async function deleteMedia(req, res) {
  const { id } = validateParams(req.params);

  await mediaService.deleteMediaAsset(req.user.id, id);

  return successResponse(res, 200, "Media asset deleted successfully");
}

module.exports = {
  ensureContentItemAccess,
  uploadMedia,
  listMedia,
  deleteMedia,
};
