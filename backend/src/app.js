const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { publicUploadPath, uploadRoot } = require("./config/storage");
const routes = require("./routes");
const notFoundMiddleware = require("./middlewares/notFound.middleware");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
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
