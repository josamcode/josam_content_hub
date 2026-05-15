const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const developmentAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(
          /^[0-9a-fA-F]{64}$/,
          "must be 64 hex characters for AES-256 token encryption"
        )
        .optional()
    ),
  GOOGLE_CLIENT_ID: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional()
    ),
  GOOGLE_CLIENT_SECRET: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional()
    ),
  GOOGLE_REDIRECT_URI: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional()
    ),
  YOUTUBE_OAUTH_SUCCESS_REDIRECT_URL: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional()
    ),
  YOUTUBE_OAUTH_ERROR_REDIRECT_URL: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional()
    ),
  YOUTUBE_UPLOAD_PRIVACY_STATUS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(["private", "unlisted", "public"]).default("private")
  ),
  YOUTUBE_DEFAULT_CATEGORY_ID: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().min(1).optional()
  ),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SEED_USER_NAME: z.string().min(1),
  SEED_USER_EMAIL: z.string().email(),
  SEED_USER_PASSWORD: z.string().min(1),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  PUBLIC_UPLOAD_BASE_URL: z
    .string()
    .min(1)
    .default("http://localhost:5000/uploads"),
  FRONTEND_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");

  throw new Error(`Invalid environment variables: ${message}`);
}

function parseAllowedOrigins(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function validateAllowedOrigins(origins, source) {
  for (const origin of origins) {
    if (origin === "*") {
      throw new Error(`${source} must not include wildcard origins`);
    }

    try {
      new URL(origin);
    } catch {
      throw new Error(`${source} includes an invalid origin: ${origin}`);
    }
  }
}

function resolveAllowedOrigins(env) {
  const origins = parseAllowedOrigins(env.ALLOWED_ORIGINS);
  if (env.FRONTEND_URL) origins.push(env.FRONTEND_URL);

  if (origins.length > 0) {
    validateAllowedOrigins(origins, "ALLOWED_ORIGINS");
    return Array.from(new Set(origins));
  }

  if (env.NODE_ENV === "production") {
    throw new Error("ALLOWED_ORIGINS or FRONTEND_URL is required in production");
  }

  return developmentAllowedOrigins;
}

const allowedOrigins = resolveAllowedOrigins(parsedEnv.data);

module.exports = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  tokenEncryptionKey: parsedEnv.data.TOKEN_ENCRYPTION_KEY,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: parsedEnv.data.GOOGLE_REDIRECT_URI,
  youtubeOauthSuccessRedirectUrl:
    parsedEnv.data.YOUTUBE_OAUTH_SUCCESS_REDIRECT_URL,
  youtubeOauthErrorRedirectUrl: parsedEnv.data.YOUTUBE_OAUTH_ERROR_REDIRECT_URL,
  youtubeUploadPrivacyStatus: parsedEnv.data.YOUTUBE_UPLOAD_PRIVACY_STATUS,
  youtubeDefaultCategoryId: parsedEnv.data.YOUTUBE_DEFAULT_CATEGORY_ID,
  authRateLimitWindowMs: parsedEnv.data.AUTH_RATE_LIMIT_WINDOW_MS,
  authRateLimitMax: parsedEnv.data.AUTH_RATE_LIMIT_MAX,
  seedUserName: parsedEnv.data.SEED_USER_NAME,
  seedUserEmail: parsedEnv.data.SEED_USER_EMAIL,
  seedUserPassword: parsedEnv.data.SEED_USER_PASSWORD,
  uploadDir: parsedEnv.data.UPLOAD_DIR,
  publicUploadBaseUrl: parsedEnv.data.PUBLIC_UPLOAD_BASE_URL,
  frontendUrl: parsedEnv.data.FRONTEND_URL,
  allowedOrigins,
  isProduction: parsedEnv.data.NODE_ENV === "production",
};
