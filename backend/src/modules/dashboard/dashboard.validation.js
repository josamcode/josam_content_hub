const { z } = require("zod");

const dashboardQuerySchema = z.object({
  timezone: z.string().trim().min(1).default("Africa/Cairo"),
  upcomingLimit: z.coerce.number().int().positive().max(50).default(5),
  recentLimit: z.coerce.number().int().positive().max(50).default(5),
});

module.exports = {
  dashboardQuerySchema,
};
