const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const reminderService = require("./reminder.service");
const {
  listRemindersQuerySchema,
  updateReminderSchema,
  idParamsSchema,
} = require("./reminder.validation");

function validateParams(params) {
  const parsedParams = idParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    throw new ApiError(422, "Invalid reminder id");
  }

  return parsedParams.data;
}

async function listReminders(req, res) {
  const parsedQuery = listRemindersQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid reminder filters");
  }

  const data = await reminderService.listReminders(
    req.user.id,
    parsedQuery.data
  );

  return res.status(200).json({
    success: true,
    data,
  });
}

async function getReminder(req, res) {
  const { id } = validateParams(req.params);
  const data = await reminderService.getReminderById(req.user.id, id);

  return res.status(200).json({
    success: true,
    data,
  });
}

async function updateReminder(req, res) {
  const { id } = validateParams(req.params);
  const parsedBody = updateReminderSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid reminder data");
  }

  const data = await reminderService.updateReminder(
    req.user.id,
    id,
    parsedBody.data
  );

  return successResponse(res, 200, "Reminder updated successfully", data);
}

module.exports = {
  listReminders,
  getReminder,
  updateReminder,
};
