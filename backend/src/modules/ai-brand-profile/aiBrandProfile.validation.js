const { z } = require("zod");

const PLATFORM_KEYS = ["youtube", "instagram", "facebook", "tiktok"];

const platformKeySchema = z.enum(PLATFORM_KEYS);

const nullableTrimmedString = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const stringArrayField = z
  .array(z.string().trim().min(1))
  .max(100)
  .optional();

const platformInstructionsSchema = z
  .object({
    youtube: z.string().max(2000).optional(),
    instagram: z.string().max(2000).optional(),
    facebook: z.string().max(2000).optional(),
    tiktok: z.string().max(2000).optional(),
  })
  .strict()
  .optional();

const updateAiBrandProfileSchema = z
  .object({
    audience: nullableTrimmedString.optional(),
    tone: nullableTrimmedString.optional(),
    language: z.string().trim().max(80).optional(),
    contentGoal: nullableTrimmedString.optional(),
    ctaStyle: nullableTrimmedString.optional(),
    forbiddenWords: stringArrayField,
    hashtagBank: stringArrayField,
    servicesToPromote: stringArrayField,
    courseTopics: stringArrayField,
    platformInstructions: platformInstructionsSchema,
  })
  .strict();

module.exports = {
  PLATFORM_KEYS,
  updateAiBrandProfileSchema,
};
