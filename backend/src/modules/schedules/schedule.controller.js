const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const scheduleService = require("./schedule.service");
const {
  createScheduleSchema,
  updateScheduleSchema,
  calendarQuerySchema,
  idParamsSchema,
} = require("./schedule.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid id");
  }

  return parsedParams.data;
}

async function saveSchedule(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = createScheduleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid schedule data");
  }

  const data = await scheduleService.saveSchedule(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Schedule saved successfully", data);
}

async function updateSchedule(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = updateScheduleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid schedule data");
  }

  const data = await scheduleService.updateSchedule(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Schedule updated successfully", data);
}

async function cancelSchedule(req, res) {
  const { id } = validateParams(req.params);

  await scheduleService.cancelSchedule(req.user.id, id);

  return successResponse(res, 200, "Schedule cancelled successfully");
}

async function listCalendar(req, res) {
  const parsedQuery = calendarQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid calendar filters");
  }

  const data = await scheduleService.listCalendar(req.user.id, parsedQuery.data);

  return res.status(200).json({
    success: true,
    data,
  });
}

module.exports = {
  saveSchedule,
  updateSchedule,
  cancelSchedule,
  listCalendar,
};
