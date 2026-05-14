const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const platformPostService = require("./platformPost.service");
const {
  createPlatformPostSchema,
  updatePlatformPostSchema,
  applyPlatformDefaultsSchema,
  idParamsSchema,
} = require("./platformPost.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid id");
  }

  return parsedParams.data;
}

async function listPlatformPosts(req, res) {
  const { id } = validateParams(req.params);
  const data = await platformPostService.listPlatformPosts(req.user.id, id);

  return res.status(200).json({
    success: true,
    data,
  });
}

async function createPlatformPost(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = createPlatformPostSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid platform post data");
  }

  const data = await platformPostService.createPlatformPost(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 201, "Platform post created successfully", data);
}

async function applyPlatformDefaults(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = applyPlatformDefaultsSchema.safeParse(req.body || {});

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid apply defaults data");
  }

  const data = await platformPostService.applyPlatformDefaults(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(
    res,
    200,
    "Platform defaults applied successfully",
    data
  );
}

async function updatePlatformPost(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = updatePlatformPostSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid platform post data");
  }

  const data = await platformPostService.updatePlatformPost(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Platform post updated successfully", data);
}

async function deletePlatformPost(req, res) {
  const { id } = validateParams(req.params);

  await platformPostService.deletePlatformPost(req.user.id, id);

  return successResponse(res, 200, "Platform post deleted successfully");
}

async function validatePlatformPost(req, res) {
  const { id } = validateParams(req.params);
  const data = await platformPostService.validatePlatformPost(req.user.id, id);

  return res.status(200).json({
    success: true,
    data,
  });
}

module.exports = {
  listPlatformPosts,
  createPlatformPost,
  applyPlatformDefaults,
  updatePlatformPost,
  deletePlatformPost,
  validatePlatformPost,
};
