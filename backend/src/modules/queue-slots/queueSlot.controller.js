const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const queueSlotService = require("./queueSlot.service");
const {
  listQueueSlotsQuerySchema,
  createQueueSlotSchema,
  updateQueueSlotSchema,
  idParamsSchema,
} = require("./queueSlot.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid queue slot id");
  }

  return parsedParams.data;
}

async function listQueueSlots(req, res) {
  const parsedQuery = listQueueSlotsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid queue slot filters");
  }

  const data = await queueSlotService.listQueueSlots(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data,
  });
}

async function createQueueSlot(req, res) {
  const parsedBody = createQueueSlotSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid queue slot data");
  }

  const data = await queueSlotService.createQueueSlot(
    req.user.id,
    parsedBody.data
  );

  return successResponse(res, 201, "Queue slot created successfully", data);
}

async function updateQueueSlot(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = updateQueueSlotSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid queue slot data");
  }

  const data = await queueSlotService.updateQueueSlot(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Queue slot updated successfully", data);
}

async function deactivateQueueSlot(req, res) {
  const { id } = validateParams(req.params);

  await queueSlotService.deactivateQueueSlot(req.user.id, id);

  return successResponse(res, 200, "Queue slot deactivated successfully");
}

module.exports = {
  listQueueSlots,
  createQueueSlot,
  updateQueueSlot,
  deactivateQueueSlot,
};
