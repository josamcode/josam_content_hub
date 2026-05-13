const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const scheduleController = require("./schedule.controller");

const router = express.Router();

router.post(
  "/platform-posts/:id/schedule",
  authMiddleware,
  asyncHandler(scheduleController.saveSchedule)
);

router
  .route("/schedules/:id")
  .patch(authMiddleware, asyncHandler(scheduleController.updateSchedule))
  .delete(authMiddleware, asyncHandler(scheduleController.cancelSchedule));

router.get(
  "/calendar",
  authMiddleware,
  asyncHandler(scheduleController.listCalendar)
);

module.exports = router;
