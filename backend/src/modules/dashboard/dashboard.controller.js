const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const dashboardService = require("./dashboard.service");
const { dashboardQuerySchema } = require("./dashboard.validation");

async function getDashboard(req, res) {
  const parsedQuery = dashboardQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(422, "Invalid dashboard filters");
  }

  const data = await dashboardService.getDashboard(
    req.user.id,
    parsedQuery.data
  );

  return successResponse(res, 200, "Dashboard retrieved successfully", data);
}

module.exports = {
  getDashboard,
};
