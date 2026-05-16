const { z } = require("zod");

const optionalEmailSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().email().optional()
);

const testEmailSchema = z
  .object({
    to: optionalEmailSchema,
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  testEmailSchema,
  idParamsSchema,
};
