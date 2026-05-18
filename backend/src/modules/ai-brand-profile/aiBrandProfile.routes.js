const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const aiBrandProfileController = require("./aiBrandProfile.controller");

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .get(asyncHandler(aiBrandProfileController.getProfile))
  .patch(asyncHandler(aiBrandProfileController.updateProfile));

module.exports = router;
