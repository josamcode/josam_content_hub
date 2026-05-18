const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const aiBrandProfileService = require("./aiBrandProfile.service");
const { updateAiBrandProfileSchema } = require("./aiBrandProfile.validation");

async function getProfile(req, res) {
  const data = await aiBrandProfileService.getOrCreateProfile(req.user.id);

  return res.status(200).json({
    success: true,
    data,
  });
}

async function updateProfile(req, res) {
  const parsed = updateAiBrandProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(422, "Invalid AI brand profile data");
  }

  const data = await aiBrandProfileService.updateProfile(
    req.user.id,
    parsed.data
  );

  return successResponse(res, 200, "AI brand profile updated successfully", data);
}

module.exports = {
  getProfile,
  updateProfile,
};
