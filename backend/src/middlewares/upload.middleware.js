const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const multer = require("multer");

const {
  ensureDirectory,
  getMediaDirectory,
} = require("../config/storage");
const ApiError = require("../utils/apiError");

const maxFileSizes = {
  video: 500 * 1024 * 1024,
  thumbnail: 20 * 1024 * 1024,
  image: 20 * 1024 * 1024,
  attachment: 50 * 1024 * 1024,
};

const safeAttachmentMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sanitizeFileName(fileName) {
  const parsedPath = path.parse(fileName);
  const safeBaseName =
    parsedPath.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";
  const safeExtension = parsedPath.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");

  return `${safeBaseName}${safeExtension}`;
}

function isMimeTypeAllowed(type, mimeType) {
  if (type === "video") {
    return mimeType.startsWith("video/");
  }

  if (type === "thumbnail" || type === "image") {
    return mimeType.startsWith("image/");
  }

  if (type === "attachment") {
    return safeAttachmentMimeTypes.has(mimeType);
  }

  return false;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const type = req.body.type;
    const contentItemId = req.params.id;

    if (!maxFileSizes[type]) {
      return callback(new ApiError(422, "Invalid media type"));
    }

    const destination = getMediaDirectory(type, contentItemId);
    ensureDirectory(destination);

    return callback(null, destination);
  },
  filename(req, file, callback) {
    const safeFileName = sanitizeFileName(file.originalname);
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;

    return callback(null, `${uniquePrefix}-${safeFileName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizes.video,
  },
  fileFilter(req, file, callback) {
    const type = req.body.type;

    if (!maxFileSizes[type]) {
      return callback(new ApiError(422, "Invalid media type"));
    }

    if (!isMimeTypeAllowed(type, file.mimetype)) {
      return callback(new ApiError(422, "Invalid file type for media type"));
    }

    return callback(null, true);
  },
});

function mediaUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error && req.file && req.file.size > maxFileSizes[req.body.type]) {
      fs.unlink(req.file.path, () => {});
      return next(new ApiError(422, "File size exceeds media type limit"));
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(422, "File size exceeds media type limit"));
    }

    if (error) {
      return next(error);
    }

    return next();
  });
}

module.exports = {
  mediaUpload,
  maxFileSizes,
  sanitizeFileName,
};
