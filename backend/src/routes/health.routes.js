const express = require("express");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    return successResponse(res, 200, "Backend is healthy", {
      service: "JoSam Content Hub API",
      status: "ok",
    });
  })
);

module.exports = router;
