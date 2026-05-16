const { z } = require("zod");

const mediaTypes = ["video", "thumbnail", "image", "attachment"];
const mediaStatuses = ["active", "missing", "deleted"];
const mediaSortFields = ["fileSizeBytes", "createdAt"];
const sortOrders = ["asc", "desc"];

const uploadMediaSchema = z
  .object({
    type: z.enum(mediaTypes),
  })
  .strict();

const listMediaQuerySchema = z.object({
  type: z.enum(mediaTypes).optional(),
});

const listMediaAssetsQuerySchema = z.object({
  type: z.enum(mediaTypes).optional(),
  status: z.enum(mediaStatuses).optional(),
  contentItemId: z.string().min(1).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(mediaSortFields).default("createdAt"),
  sortOrder: z.enum(sortOrders).default("desc"),
});

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  uploadMediaSchema,
  listMediaQuerySchema,
  listMediaAssetsQuerySchema,
  idParamsSchema,
};
