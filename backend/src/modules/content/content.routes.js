const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const contentController = require("./content.controller");

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .get(asyncHandler(contentController.listContentItems))
  .post(asyncHandler(contentController.createContentItem));

router
  .route("/:id")
  .get(asyncHandler(contentController.getContentItem))
  .patch(asyncHandler(contentController.updateContentItem))
  .delete(asyncHandler(contentController.archiveContentItem));

module.exports = router;
