const { z } = require("zod");

const mediaTypes = ["video", "thumbnail", "image", "attachment"];

const uploadMediaSchema = z
  .object({
    type: z.enum(mediaTypes),
  })
  .strict();

const listMediaQuerySchema = z.object({
  type: z.enum(mediaTypes).optional(),
});

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  uploadMediaSchema,
  listMediaQuerySchema,
  idParamsSchema,
};
