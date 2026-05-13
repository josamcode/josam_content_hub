const jwt = require("jsonwebtoken");

const env = require("../config/env");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../modules/auth/auth.service");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication token is required");
  }

  if (!env.jwtSecret) {
    throw new ApiError(500, "Server configuration error");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  if (!payload.id) {
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  const user = await authService.getSafeUserById(payload.id);

  if (!user) {
    throw new ApiError(401, "Invalid or expired authentication token");
  }

  req.user = user;
  return next();
});

module.exports = authMiddleware;
