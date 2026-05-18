const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const aiMetadataController = require("./aiMetadata.controller");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/generate-platform-metadata",
  asyncHandler(aiMetadataController.generatePlatformMetadata)
);

module.exports = router;
