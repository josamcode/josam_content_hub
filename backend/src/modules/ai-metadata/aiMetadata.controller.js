const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const aiMetadataService = require("./aiMetadata.service");
const { generatePlatformMetadataSchema } = require("./aiMetadata.validation");

async function generatePlatformMetadata(req, res) {
  const parsed = generatePlatformMetadataSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(422, "Invalid request data", parsed.error.issues);
  }

  const data = await aiMetadataService.generatePlatformMetadata(
    req.user.id,
    parsed.data
  );

  return successResponse(res, 200, "Metadata generated successfully", data);
}

module.exports = {
  generatePlatformMetadata,
};
