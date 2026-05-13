const fs = require("fs");
const path = require("path");

const env = require("./env");

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
const publicUploadPath = "/uploads";

const mediaTypeFolders = {
  video: "videos",
  thumbnail: "thumbnails",
  image: "images",
  attachment: "attachments",
};

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function getMediaFolder(type) {
  return mediaTypeFolders[type];
}

function getMediaDirectory(type, contentItemId) {
  const folder = getMediaFolder(type);

  if (!folder) {
    throw new Error(`Unsupported media type: ${type}`);
  }

  return path.join(uploadRoot, folder, contentItemId);
}

function getStorageKey(type, contentItemId, fileName) {
  return path.posix.join(getMediaFolder(type), contentItemId, fileName);
}

function getFileUrl(storageKey) {
  return `${publicUploadPath}/${storageKey.replace(/\\/g, "/")}`;
}

function getAbsolutePathFromStorageKey(storageKey) {
  const normalizedStorageKey = storageKey.replace(/\//g, path.sep);
  const absolutePath = path.resolve(uploadRoot, normalizedStorageKey);

  if (!absolutePath.startsWith(uploadRoot)) {
    throw new Error("Invalid storage key");
  }

  return absolutePath;
}

ensureDirectory(uploadRoot);

module.exports = {
  uploadRoot,
  publicUploadPath,
  mediaTypeFolders,
  ensureDirectory,
  getMediaDirectory,
  getStorageKey,
  getFileUrl,
  getAbsolutePathFromStorageKey,
};
