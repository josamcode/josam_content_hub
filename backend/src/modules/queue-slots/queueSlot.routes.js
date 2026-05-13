const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const queueSlotController = require("./queueSlot.controller");

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .get(asyncHandler(queueSlotController.listQueueSlots))
  .post(asyncHandler(queueSlotController.createQueueSlot));

router
  .route("/:id")
  .patch(asyncHandler(queueSlotController.updateQueueSlot))
  .delete(asyncHandler(queueSlotController.deactivateQueueSlot));

module.exports = router;
