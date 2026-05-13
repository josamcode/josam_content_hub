const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const { mediaUpload } = require("../../middlewares/upload.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const mediaController = require("./media.controller");

const router = express.Router();

router
  .route("/content-items/:id/media")
  .get(authMiddleware, asyncHandler(mediaController.listMedia))
  .post(
    authMiddleware,
    asyncHandler(mediaController.ensureContentItemAccess),
    mediaUpload,
    asyncHandler(mediaController.uploadMedia)
  );

router.delete(
  "/media-assets/:id",
  authMiddleware,
  asyncHandler(mediaController.deleteMedia)
);

module.exports = router;
