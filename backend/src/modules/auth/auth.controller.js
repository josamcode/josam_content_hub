const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const authService = require("./auth.service");
const { loginSchema } = require("./auth.validation");

async function login(req, res) {
  const parsedBody = loginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(422, "Invalid email or password format");
  }

  const data = await authService.login(parsedBody.data);

  return successResponse(res, 200, "Logged in successfully", data);
}

async function me(req, res) {
  return successResponse(
    res,
    200,
    "Current user retrieved successfully",
    req.user
  );
}

module.exports = {
  login,
  me,
};
