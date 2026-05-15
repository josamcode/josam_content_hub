const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const youtubeService = require("./youtube.service");
const { youtubeCallbackQuerySchema } = require("./youtube.validation");

function appendRedirectParams(baseUrl, params) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function callbackErrorResponse(res, error) {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode
    ? error.message
    : "YouTube connection failed";

  if (env.youtubeOauthErrorRedirectUrl) {
    return res.redirect(
      appendRedirectParams(env.youtubeOauthErrorRedirectUrl, {
        youtube: "error",
        message,
      })
    );
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

async function startConnect(req, res) {
  const data = await youtubeService.startConnect(req.user.id);

  return successResponse(res, 200, "YouTube authorization URL created", data);
}

async function handleCallback(req, res) {
  try {
    const parsedQuery = youtubeCallbackQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new ApiError(422, "Invalid YouTube OAuth callback");
    }

    const data = await youtubeService.handleCallback(parsedQuery.data);

    if (env.youtubeOauthSuccessRedirectUrl) {
      return res.redirect(
        appendRedirectParams(env.youtubeOauthSuccessRedirectUrl, {
          youtube: "connected",
        })
      );
    }

    return successResponse(res, 200, "YouTube connected successfully", data);
  } catch (error) {
    return callbackErrorResponse(res, error);
  }
}

async function getStatus(req, res) {
  const data = await youtubeService.getStatus(req.user.id);

  return successResponse(
    res,
    200,
    "YouTube connection status retrieved",
    data
  );
}

async function disconnect(req, res) {
  const data = await youtubeService.disconnect(req.user.id);

  return successResponse(res, 200, "YouTube disconnected successfully", data);
}

module.exports = {
  disconnect,
  getStatus,
  handleCallback,
  startConnect,
};
