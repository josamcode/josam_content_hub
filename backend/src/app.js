const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const env = require("./config/env");
const { publicUploadPath, uploadRoot } = require("./config/storage");
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Uploaded media is public by design in this MVP. Override the default
// Cross-Origin-Resource-Policy set by helmet so frontends on a different
// origin can embed <img>/<video> previews without disabling helmet globally.
app.use(
  publicUploadPath,
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(uploadRoot)
);

app.use("/api/v1", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
