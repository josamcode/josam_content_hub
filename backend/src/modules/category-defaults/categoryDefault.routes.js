const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const categoryDefaultController = require("./categoryDefault.controller");

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(categoryDefaultController.listCategoryDefaults));

router
  .route("/:category")
  .get(asyncHandler(categoryDefaultController.getCategoryDefault))
  .patch(asyncHandler(categoryDefaultController.updateCategoryDefault));

module.exports = router;
