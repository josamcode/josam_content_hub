const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const reminderController = require("./reminder.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(reminderController.listReminders));

router
  .route("/:id")
  .get(asyncHandler(reminderController.getReminder))
  .patch(asyncHandler(reminderController.updateReminder));

module.exports = router;
