const { z } = require("zod");

const PLATFORM_KEYS = ["youtube", "instagram", "facebook", "tiktok"];

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

const generatePlatformMetadataSchema = z
  .object({
    idea: z.string().min(1).max(5000),
    category: z.enum(CONTENT_CATEGORIES).optional(),
    targetPlatforms: z.array(z.enum(PLATFORM_KEYS)).min(1),
    language: z.enum(["ar", "en"]).optional(),
  })
  .strict();

const aiOutputSchema = z
  .object({
    youtube: z
      .object({
        title: z.string().min(1),
        description: z.string().min(1),
        tags: z.array(z.string()),
        hashtags: z.array(z.string()),
      })
      .optional(),
    instagram: z
      .object({
        caption: z.string().min(1),
        hashtags: z.array(z.string()),
      })
      .optional(),
    facebook: z
      .object({
        caption: z.string().min(1),
        hashtags: z.array(z.string()),
      })
      .optional(),
    tiktok: z
      .object({
        caption: z.string().min(1),
        hashtags: z.array(z.string()),
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "AI output must include at least one platform"
  );

module.exports = {
  PLATFORM_KEYS,
  generatePlatformMetadataSchema,
  aiOutputSchema,
};
