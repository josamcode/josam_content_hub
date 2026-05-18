const { z } = require("zod");

const metaCallbackQuerySchema = z
  .object({
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    error_description: z.string().optional(),
    error_reason: z.string().optional(),
  })
  .passthrough();

const metaSelectPageSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
});

module.exports = {
  metaCallbackQuerySchema,
  metaSelectPageSchema,
};
