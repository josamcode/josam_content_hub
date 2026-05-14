const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const categoryDefaultService = require("./categoryDefault.service");
const {
  categoryParamsSchema,
  updateCategoryDefaultSchema,
} = require("./categoryDefault.validation");

function validateCategoryParams(params) {
  const parsed = categoryParamsSchema.safeParse(params);

  if (!parsed.success) {
    throw new ApiError(422, "Invalid content category");
  }

  return parsed.data;
}

async function listCategoryDefaults(req, res) {
  const data = await categoryDefaultService.listCategoryDefaults(req.user.id);

  return res.status(200).json({
    success: true,
    data,
  });
}

async function getCategoryDefault(req, res) {
  const { category } = validateCategoryParams(req.params);

  const data = await categoryDefaultService.getCategoryDefault(
    req.user.id,
    category
  );

  return res.status(200).json({
    success: true,
    data,
  });
}

async function updateCategoryDefault(req, res) {
  const { category } = validateCategoryParams(req.params);
  const parsedBody = updateCategoryDefaultSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid content category default data");
  }

  const data = await categoryDefaultService.updateCategoryDefault(
    req.user.id,
    category,
    parsedBody.data
  );

  return successResponse(
    res,
    200,
    "Content category default updated successfully",
    data
  );
}

module.exports = {
  listCategoryDefaults,
  getCategoryDefault,
  updateCategoryDefault,
};
