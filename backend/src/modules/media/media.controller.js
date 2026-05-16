const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const mediaService = require("./media.service");
const {
  uploadMediaSchema,
  listMediaQuerySchema,
  listMediaAssetsQuerySchema,
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

async function listMediaAssets(req, res) {
  const parsedQuery = listMediaAssetsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid media asset filters");
  }

  const result = await mediaService.listAllMediaAssets(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

async function getStorageSummary(req, res) {
  const data = await mediaService.getStorageSummary(req.user.id);

  return successResponse(res, 200, "Media storage summary loaded", data);
}

async function scanStorage(req, res) {
  const data = await mediaService.scanStorage(req.user.id);

  return successResponse(res, 200, "Media storage scan completed", data);
}

async function deleteMedia(req, res) {
  const { id } = validateParams(req.params);

  const data = await mediaService.deleteMediaAsset(req.user.id, id);

  return successResponse(res, 200, "Media asset deleted successfully", data);
}

module.exports = {
  ensureContentItemAccess,
  uploadMedia,
  listMedia,
  listMediaAssets,
  getStorageSummary,
  scanStorage,
  deleteMedia,
};
