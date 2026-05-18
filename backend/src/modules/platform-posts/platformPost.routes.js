const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const platformPostController = require("./platformPost.controller");

const router = express.Router();

router
  .route("/content-items/:id/platform-posts")
  .get(authMiddleware, asyncHandler(platformPostController.listPlatformPosts))
  .post(authMiddleware, asyncHandler(platformPostController.createPlatformPost));

router.post(
  "/platform-posts/:id/validate",
  authMiddleware,
  asyncHandler(platformPostController.validatePlatformPost)
);

router.post(
  "/platform-posts/:id/apply-defaults",
  authMiddleware,
  asyncHandler(platformPostController.applyPlatformDefaults)
);

router.post(
  "/platform-posts/:id/youtube/upload",
  authMiddleware,
  asyncHandler(platformPostController.uploadYouTube)
);

router.post(
  "/platform-posts/:id/facebook/publish",
  authMiddleware,
  asyncHandler(platformPostController.publishFacebook)
);

router
  .route("/platform-posts/:id")
  .patch(authMiddleware, asyncHandler(platformPostController.updatePlatformPost))
  .delete(authMiddleware, asyncHandler(platformPostController.deletePlatformPost));

module.exports = router;
