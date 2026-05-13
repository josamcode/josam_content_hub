const { z } = require("zod");

const platforms = ["youtube", "instagram", "facebook", "tiktok"];
const timeOfDayRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const platformSchema = z.enum(platforms);
const timeOfDaySchema = z.string().regex(timeOfDayRegex);

const activeQuerySchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean().optional());

const listQueueSlotsQuerySchema = z.object({
  platform: platformSchema.optional(),
  active: activeQuerySchema,
});

const createQueueSlotSchema = z
  .object({
    platform: platformSchema,
    dayOfWeek: z.number().int().min(0).max(6),
    timeOfDay: timeOfDaySchema,
    timezone: z.string().trim().min(1),
  })
  .strict();

const updateQueueSlotSchema = z
  .object({
    platform: platformSchema.optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    timeOfDay: timeOfDaySchema.optional(),
    timezone: z.string().trim().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  listQueueSlotsQuerySchema,
  createQueueSlotSchema,
  updateQueueSlotSchema,
  idParamsSchema,
};
