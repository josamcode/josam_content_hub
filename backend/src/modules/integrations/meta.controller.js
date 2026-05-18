const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const { successResponse } = require("../../utils/apiResponse");
const metaService = require("./meta.service");
const {
  metaCallbackQuerySchema,
  metaSelectPageSchema,
} = require("./meta.validation");

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
    : "Meta connection failed";

  if (env.metaOauthErrorRedirectUrl) {
    return res.redirect(
      appendRedirectParams(env.metaOauthErrorRedirectUrl, {
        meta: "error",
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
  const data = await metaService.startConnect(req.user.id);

  return successResponse(res, 200, "Meta authorization URL created", data);
}

async function handleCallback(req, res) {
  try {
    const parsedQuery = metaCallbackQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new ApiError(422, "Invalid Meta OAuth callback");
    }

    const data = await metaService.handleCallback(parsedQuery.data);

    if (env.metaOauthSuccessRedirectUrl) {
      return res.redirect(
        appendRedirectParams(env.metaOauthSuccessRedirectUrl, {
          meta: "connected",
        })
      );
    }

    return successResponse(res, 200, "Meta connected successfully", data);
  } catch (error) {
    return callbackErrorResponse(res, error);
  }
}

async function getStatus(req, res) {
  const data = await metaService.getStatus(req.user.id);

  return successResponse(
    res,
    200,
    "Meta connection status retrieved",
    data
  );
}

async function getPages(req, res) {
  const data = await metaService.getPages(req.user.id);

  return successResponse(res, 200, "Meta pages retrieved", data);
}

async function selectPage(req, res) {
  const parsed = metaSelectPageSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(422, "Invalid page selection", parsed.error.issues);
  }

  const data = await metaService.selectPage(req.user.id, parsed.data.pageId);

  return successResponse(res, 200, "Meta page selected", data);
}

async function disconnect(req, res) {
  const data = await metaService.disconnect(req.user.id);

  return successResponse(res, 200, "Meta disconnected successfully", data);
}

module.exports = {
  disconnect,
  getPages,
  getStatus,
  handleCallback,
  selectPage,
  startConnect,
};
