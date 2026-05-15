const { z } = require("zod");

const youtubeCallbackQuerySchema = z
  .object({
    code: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    error_description: z.string().optional(),
    error_uri: z.string().optional(),
  })
  .passthrough();

module.exports = {
  youtubeCallbackQuerySchema,
};
