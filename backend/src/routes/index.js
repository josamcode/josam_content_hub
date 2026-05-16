const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const categoryDefaultRoutes = require("../modules/category-defaults/categoryDefault.routes");
const contentRoutes = require("../modules/content/content.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const emailRoutes = require("../modules/email/email.routes");
const healthRoutes = require("./health.routes");
const youtubeIntegrationRoutes = require("../modules/integrations/youtube.routes");
const mediaRoutes = require("../modules/media/media.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const platformPostRoutes = require("../modules/platform-posts/platformPost.routes");
const platformSettingRoutes = require("../modules/platform-settings/platformSetting.routes");
const publishingRoutes = require("../modules/publishing/publishing.routes");
const queueSlotRoutes = require("../modules/queue-slots/queueSlot.routes");
const reminderRoutes = require("../modules/reminders/reminder.routes");
const scheduleRoutes = require("../modules/schedules/schedule.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/category-defaults", categoryDefaultRoutes);
router.use("/content-items", contentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/email", emailRoutes);
router.use("/integrations/youtube", youtubeIntegrationRoutes);
router.use("/", mediaRoutes);
router.use("/notifications", notificationRoutes);
router.use("/", platformPostRoutes);
router.use("/platform-settings", platformSettingRoutes);
router.use("/", publishingRoutes);
router.use("/queue-slots", queueSlotRoutes);
router.use("/reminders", reminderRoutes);
router.use("/", scheduleRoutes);
router.use("/health", healthRoutes);

module.exports = router;
