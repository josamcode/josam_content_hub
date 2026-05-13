const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  asyncHandler(dashboardController.getDashboard)
);

module.exports = router;
