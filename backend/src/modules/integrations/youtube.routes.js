const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const youtubeController = require("./youtube.controller");

const router = express.Router();

router.get(
  "/connect",
  authMiddleware,
  asyncHandler(youtubeController.startConnect)
);

router.get("/callback", youtubeController.handleCallback);

router.get(
  "/status",
  authMiddleware,
  asyncHandler(youtubeController.getStatus)
);

router.delete(
  "/disconnect",
  authMiddleware,
  asyncHandler(youtubeController.disconnect)
);

module.exports = router;
