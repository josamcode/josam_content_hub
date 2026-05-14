const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const platformSettingService = require("./platformSetting.service");
const {
  platformParamsSchema,
  updatePlatformSettingSchema,
} = require("./platformSetting.validation");

function validatePlatformParams(params) {
  const parsed = platformParamsSchema.safeParse(params);

  if (!parsed.success) {
    throw new ApiError(422, "Invalid platform");
  }

  return parsed.data;
}

async function listPlatformSettings(req, res) {
  const data = await platformSettingService.listPlatformSettings(req.user.id);

  return res.status(200).json({
    success: true,
    data,
  });
}

async function getPlatformSetting(req, res) {
  const { platform } = validatePlatformParams(req.params);

  const data = await platformSettingService.getPlatformSetting(
    req.user.id,
    platform
  );

  return res.status(200).json({
    success: true,
    data,
  });
}

async function updatePlatformSetting(req, res) {
  const { platform } = validatePlatformParams(req.params);
  const parsedBody = updatePlatformSettingSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid platform setting data");
  }

  const data = await platformSettingService.updatePlatformSetting(
    req.user.id,
    platform,
    parsedBody.data
  );

  return successResponse(res, 200, "Platform setting updated successfully", data);
}

module.exports = {
  listPlatformSettings,
  getPlatformSetting,
  updatePlatformSetting,
};
