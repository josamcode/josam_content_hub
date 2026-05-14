const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const platformSettingController = require("./platformSetting.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(platformSettingController.listPlatformSettings));

router
  .route("/:platform")
  .get(asyncHandler(platformSettingController.getPlatformSetting))
  .patch(asyncHandler(platformSettingController.updatePlatformSetting));

module.exports = router;
