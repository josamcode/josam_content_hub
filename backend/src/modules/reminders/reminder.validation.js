const { z } = require("zod");

const platforms = ["youtube", "instagram", "facebook", "tiktok"];
const reminderStatuses = ["pending", "done", "cancelled", "missed"];
const reminderRanges = ["today", "upcoming", "overdue", "done"];

const listRemindersQuerySchema = z.object({
  status: z.enum(reminderStatuses).optional(),
  range: z.enum(reminderRanges).optional(),
  platform: z.enum(platforms).optional(),
});

const updateReminderSchema = z
  .object({
    status: z.enum(reminderStatuses),
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  listRemindersQuerySchema,
  updateReminderSchema,
  idParamsSchema,
};
