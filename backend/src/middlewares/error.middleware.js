const env = require("../config/env");

function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: error.message || "Internal server error",
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (!env.isProduction && error.stack) {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorMiddleware;
