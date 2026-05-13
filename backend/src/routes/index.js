const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const contentRoutes = require("../modules/content/content.routes");
const healthRoutes = require("./health.routes");
const platformPostRoutes = require("../modules/platform-posts/platformPost.routes");
const queueSlotRoutes = require("../modules/queue-slots/queueSlot.routes");
const reminderRoutes = require("../modules/reminders/reminder.routes");
const scheduleRoutes = require("../modules/schedules/schedule.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/content-items", contentRoutes);
router.use("/", platformPostRoutes);
router.use("/queue-slots", queueSlotRoutes);
router.use("/reminders", reminderRoutes);
router.use("/", scheduleRoutes);
router.use("/health", healthRoutes);

module.exports = router;
