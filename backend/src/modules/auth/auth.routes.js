const express = require("express");

const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const {
  loginRateLimit,
} = require("../../middlewares/authRateLimit.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const router = express.Router();

router.post("/login", loginRateLimit, asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.me));

module.exports = router;
