const { z } = require("zod");

const contentItemStatuses = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "ready",
  "scheduled",
  "published",
  "failed",
  "archived",
];

const contentCategories = [
  "programming",
  "software_engineering",
  "business_systems",
  "ara_financial",
  "portfolio_client_acquisition",
  "course_content",
  "saas_product_journey",
  "personal_brand",
];

const platforms = ["youtube", "instagram", "facebook", "tiktok"];

const contentItemStatusSchema = z.enum(contentItemStatuses);
const contentCategorySchema = z.enum(contentCategories);
const platformSchema = z.enum(platforms);

const targetPlatformsSchema = z
  .array(platformSchema)
  .superRefine((items, ctx) => {
    const seen = new Set();

    items.forEach((item, index) => {
      if (seen.has(item)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetPlatforms must not contain duplicates",
          path: [index],
        });
      }

      seen.add(item);
    });
  });

const createContentItemSchema = z.object({
  title: z.string().trim().min(1),
  category: contentCategorySchema,
  hook: z.string().optional(),
  script: z.string().optional(),
  notes: z.string().optional(),
  targetPlatforms: targetPlatformsSchema.optional(),
});

const updateContentItemSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    category: contentCategorySchema.optional(),
    hook: z.string().optional(),
    script: z.string().optional(),
    notes: z.string().optional(),
    status: contentItemStatusSchema.optional(),
  })
  .strict();

const listContentItemsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: contentItemStatusSchema.optional(),
  category: contentCategorySchema.optional(),
  platform: platformSchema.optional(),
  search: z.string().trim().optional(),
});

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createContentItemSchema,
  updateContentItemSchema,
  listContentItemsQuerySchema,
  idParamsSchema,
};
