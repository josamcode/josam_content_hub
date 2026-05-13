const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  SEED_USER_NAME: z.string().min(1),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_PASSWORD: z.string().min(1),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  PUBLIC_UPLOAD_BASE_URL: z
    .string()
    .min(1)
    .default("http://localhost:5000/uploads"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");

  throw new Error(`Invalid environment variables: ${message}`);
}

module.exports = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  seedUserName: parsedEnv.data.SEED_USER_NAME,
  seedUserEmail: parsedEnv.data.SEED_USER_EMAIL,
  seedUserPassword: parsedEnv.data.SEED_USER_PASSWORD,
  uploadDir: parsedEnv.data.UPLOAD_DIR,
  publicUploadBaseUrl: parsedEnv.data.PUBLIC_UPLOAD_BASE_URL,
  isProduction: parsedEnv.data.NODE_ENV === "production",
};
