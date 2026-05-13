const { z } = require("zod");

const platforms = ["youtube", "instagram", "facebook", "tiktok"];

const platformPostStatuses = [
  "draft",
  "ready",
  "scheduled",
  "published",
  "failed",
  "manual_pending",
  "manual_done",
];

const platformSchema = z.enum(platforms);
const platformPostStatusSchema = z.enum(platformPostStatuses);

const platformPostUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().url().nullable().optional()
);

const createPlatformPostSchema = z
  .object({
    platform: platformSchema,
  })
  .strict();

const updatePlatformPostSchema = z
  .object({
    title: z.string().optional(),
    caption: z.string().optional(),
    description: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    status: platformPostStatusSchema.optional(),
    platformPostUrl: platformPostUrlSchema,
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  createPlatformPostSchema,
  updatePlatformPostSchema,
  idParamsSchema,
};
