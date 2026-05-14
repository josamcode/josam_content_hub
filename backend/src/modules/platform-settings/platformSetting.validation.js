const { z } = require("zod");

const PLATFORMS = ["youtube", "instagram", "facebook", "tiktok"];
const PUBLISH_MODES = ["auto", "manual", "reminder"];

const platformSchema = z.enum(PLATFORMS);

const hashtagsSchema = z.array(z.string().trim().min(1)).max(50);
const tagsSchema = z.array(z.string().trim().min(1)).max(50);

const nullableTrimmedString = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const platformParamsSchema = z.object({
  platform: platformSchema,
});

const updatePlatformSettingSchema = z
  .object({
    isEnabled: z.boolean().optional(),
    defaultPublishMode: z.enum(PUBLISH_MODES).optional(),
    defaultHashtags: hashtagsSchema.optional(),
    defaultTags: tagsSchema.optional(),
    captionTemplate: nullableTrimmedString.optional(),
    titleTemplate: nullableTrimmedString.optional(),
    descriptionTemplate: nullableTrimmedString.optional(),
    notes: nullableTrimmedString.optional(),
  })
  .strict();

module.exports = {
  PLATFORMS,
  platformParamsSchema,
  updatePlatformSettingSchema,
};
