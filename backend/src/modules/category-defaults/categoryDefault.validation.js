const { z } = require("zod");

const CONTENT_CATEGORIES = [
  "programming",
  "software_engineering",
  "business_systems",
  "ara_financial",
  "portfolio_client_acquisition",
  "course_content",
  "saas_product_journey",
  "personal_brand",
];
const PLATFORMS = ["youtube", "instagram", "facebook", "tiktok"];

const categorySchema = z.enum(CONTENT_CATEGORIES);
const platformSchema = z.enum(PLATFORMS);

const nullableTrimmedString = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const hashtagsSchema = z.array(z.string().trim().min(1)).max(50);
const platformsSchema = z.array(platformSchema).max(4);

const categoryParamsSchema = z.object({
  category: categorySchema,
});

const updateCategoryDefaultSchema = z
  .object({
    defaultGoal: nullableTrimmedString.optional(),
    defaultHookStyle: nullableTrimmedString.optional(),
    defaultCaptionStyle: nullableTrimmedString.optional(),
    defaultHashtags: hashtagsSchema.optional(),
    defaultPlatforms: platformsSchema.optional(),
    notes: nullableTrimmedString.optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

module.exports = {
  CONTENT_CATEGORIES,
  categoryParamsSchema,
  updateCategoryDefaultSchema,
};
