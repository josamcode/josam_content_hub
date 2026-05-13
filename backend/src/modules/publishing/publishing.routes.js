const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const publishingController = require("./publishing.controller");

const router = express.Router();

router.post(
  "/publish/manual-complete",
  authMiddleware,
  asyncHandler(publishingController.manualComplete)
);

router.get(
  "/publish-attempts",
  authMiddleware,
  asyncHandler(publishingController.listPublishAttempts)
);

module.exports = router;
