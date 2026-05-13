const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const contentService = require("./content.service");
const {
  createContentItemSchema,
  updateContentItemSchema,
  listContentItemsQuerySchema,
  idParamsSchema,
} = require("./content.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid content item id");
  }

  return parsedParams.data;
}

async function createContentItem(req, res) {
  const parsedBody = createContentItemSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid content item data");
  }

  const data = await contentService.createContentItem(
    req.user.id,
    parsedBody.data
  );

  return successResponse(res, 201, "Content item created successfully", data);
}

async function listContentItems(req, res) {
  const parsedQuery = listContentItemsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid content item filters");
  }

  const result = await contentService.listContentItems(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

async function getContentItem(req, res) {
  const { id } = validateParams(req.params);
  const data = await contentService.getContentItemById(req.user.id, id);

  return successResponse(res, 200, "Content item retrieved successfully", data);
}

async function updateContentItem(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = updateContentItemSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid content item data");
  }

  const data = await contentService.updateContentItem(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Content item updated successfully", data);
}

async function archiveContentItem(req, res) {
  const { id } = validateParams(req.params);

  await contentService.archiveContentItem(req.user.id, id);

  return successResponse(res, 200, "Content item archived successfully");
}

module.exports = {
  createContentItem,
  listContentItems,
  getContentItem,
  updateContentItem,
  archiveContentItem,
};
