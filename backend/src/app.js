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
app.use(publicUploadPath, express.static(uploadRoot));

app.use("/api/v1", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
