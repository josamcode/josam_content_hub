const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const metaController = require("./meta.controller");

const router = express.Router();

router.get(
  "/connect",
  authMiddleware,
  asyncHandler(metaController.startConnect)
);

router.get("/callback", metaController.handleCallback);

router.get(
  "/status",
  authMiddleware,
  asyncHandler(metaController.getStatus)
);

router.get(
  "/pages",
  authMiddleware,
  asyncHandler(metaController.getPages)
);

router.post(
  "/select-page",
  authMiddleware,
  asyncHandler(metaController.selectPage)
);

router.delete(
  "/disconnect",
  authMiddleware,
  asyncHandler(metaController.disconnect)
);

module.exports = router;
