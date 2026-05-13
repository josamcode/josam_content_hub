const fs = require("fs/promises");
const path = require("path");

const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const {
  getStorageKey,
  getFileUrl,
  getAbsolutePathFromStorageKey,
} = require("../../config/storage");

const mediaAssetSelect = {
  id: true,
  type: true,
  fileUrl: true,
  storageKey: true,
  fileName: true,
  mimeType: true,
  fileSizeBytes: true,
  durationSeconds: true,
  width: true,
  height: true,
  aspectRatio: true,
  createdAt: true,
};

async function getOwnedContentItem(userId, id) {
  const contentItem = await prisma.contentItem.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!contentItem) {
    throw new ApiError(404, "Content item not found");
  }

  return contentItem;
}

async function verifyContentItemAccess(userId, id) {
  await getOwnedContentItem(userId, id);
}

async function createMediaAsset(userId, contentItemId, payload, file) {
  await getOwnedContentItem(userId, contentItemId);

  if (!file) {
    throw new ApiError(422, "Media file is required");
  }

  const fileName = path.basename(file.filename);
  const storageKey = getStorageKey(payload.type, contentItemId, fileName);

  return prisma.mediaAsset.create({
    data: {
      contentItemId,
      type: payload.type,
      fileUrl: getFileUrl(storageKey),
      storageKey,
      fileName,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      durationSeconds: null,
      width: null,
      height: null,
      aspectRatio: null,
    },
    select: mediaAssetSelect,
  });
}

async function listMediaAssets(userId, contentItemId, query) {
  await getOwnedContentItem(userId, contentItemId);

  const where = {
    contentItemId,
  };

  if (query.type) {
    where.type = query.type;
  }

  return prisma.mediaAsset.findMany({
    where,
    select: mediaAssetSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function deleteMediaAsset(userId, id) {
  const mediaAsset = await prisma.mediaAsset.findFirst({
    where: {
      id,
      contentItem: {
        userId,
      },
    },
    include: {
      contentItem: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!mediaAsset) {
    throw new ApiError(404, "Media asset not found");
  }

  if (mediaAsset.contentItem.status === "published") {
    throw new ApiError(409, "Cannot delete media from published content");
  }

  await prisma.mediaAsset.delete({
    where: {
      id,
    },
  });

  try {
    await fs.unlink(getAbsolutePathFromStorageKey(mediaAsset.storageKey));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = {
  verifyContentItemAccess,
  createMediaAsset,
  listMediaAssets,
  deleteMediaAsset,
};
