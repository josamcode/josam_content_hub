const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const emailController = require("./email.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/test", asyncHandler(emailController.sendTestEmail));
router.post(
  "/notifications/:id/send",
  asyncHandler(emailController.sendNotificationEventEmail)
);

module.exports = router;
