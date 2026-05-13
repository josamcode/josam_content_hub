const { z } = require("zod");

const platforms = ["youtube", "instagram", "facebook", "tiktok"];
const scheduleStatuses = [
  "scheduled",
  "processing",
  "published",
  "failed",
  "cancelled",
  "manual_pending",
  "manual_done",
];
const publishModes = ["auto", "manual", "reminder"];

const scheduleDateTimeSchema = z.string().datetime();
const timezoneSchema = z.string().trim().min(1);

const createScheduleSchema = z
  .object({
    scheduledAt: scheduleDateTimeSchema,
    timezone: timezoneSchema,
    publishMode: z.enum(publishModes),
  })
  .strict();

const updateScheduleSchema = z
  .object({
    scheduledAt: scheduleDateTimeSchema.optional(),
    timezone: timezoneSchema.optional(),
    publishMode: z.enum(publishModes).optional(),
    status: z.enum(scheduleStatuses).optional(),
  })
  .strict();

const calendarQuerySchema = z.object({
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  platform: z.enum(platforms).optional(),
  status: z.enum(scheduleStatuses).optional(),
});

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  calendarQuerySchema,
  idParamsSchema,
};
