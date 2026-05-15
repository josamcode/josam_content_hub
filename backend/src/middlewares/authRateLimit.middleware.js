const rateLimit = require("express-rate-limit");

const env = require("../config/env");

const loginRateLimit = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

module.exports = {
  loginRateLimit,
};
