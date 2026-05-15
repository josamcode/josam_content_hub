const { z } = require("zod");

const platforms = ["youtube", "instagram", "facebook", "tiktok"];
const publishAttemptStatuses = [
  "success",
  "failed",
  "skipped",
  "manual_completed",
  "cancelled",
];

const nullableUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().url().nullable().optional()
);

const manualCompleteSchema = z
  .object({
    platformPostId: z.string().min(1),
    scheduleId: z.string().min(1).optional(),
    platformPostUrl: nullableUrlSchema,
  })
  .strict();

const publishAttemptsQuerySchema = z.object({
  platformPostId: z.string().min(1).optional(),
  platform: z.enum(platforms).optional(),
  status: z.enum(publishAttemptStatuses).optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  manualCompleteSchema,
  publishAttemptsQuerySchema,
};
