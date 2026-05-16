const { z } = require("zod");

const severities = ["info", "success", "warning", "error"];

const booleanQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const notificationQuerySchema = z.object({
  type: z.string().trim().min(1).optional(),
  severity: z.enum(severities).optional(),
  isRead: booleanQuerySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  notificationQuerySchema,
  idParamsSchema,
};
