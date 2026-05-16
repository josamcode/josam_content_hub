const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const notificationController = require("./notification.controller");

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  asyncHandler(notificationController.listNotificationEvents)
);

router.get(
  "/:id",
  asyncHandler(notificationController.getNotificationEvent)
);

router.patch(
  "/:id/read",
  asyncHandler(notificationController.markNotificationRead)
);

module.exports = router;
