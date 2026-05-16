const fs = require("fs/promises");
const path = require("path");

const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const {
  recordNotificationEvent,
} = require("../notifications/notification.service");
const {
  getStorageKey,
  getFileUrl,
  getAbsolutePathFromStorageKey,
  uploadRoot,
  mediaTypeFolders,
} = require("../../config/storage");

const mediaAssetSelect = {
  id: true,
  type: true,
  status: true,
  fileUrl: true,
  storageKey: true,
  fileName: true,
  mimeType: true,
  fileSizeBytes: true,
  durationSeconds: true,
  width: true,
  height: true,
  aspectRatio: true,
  deletedAt: true,
  missingDetectedAt: true,
  createdAt: true,
  contentItem: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
};

const scanAssetSelect = {
  id: true,
  contentItemId: true,
  type: true,
  status: true,
  storageKey: true,
  fileName: true,
  fileSizeBytes: true,
  missingDetectedAt: true,
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

async function getOwnedContentItemIds(userId) {
  const items = await prisma.contentItem.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  return new Set(items.map((item) => item.id));
}

function buildMediaAssetWhere(userId, query = {}) {
  const where = {
    contentItem: {
      userId,
    },
  };

  if (query.contentItemId) {
    where.contentItemId = query.contentItemId;
  }

  if (query.type) {
    where.type = query.type;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      {
        fileName: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        mimeType: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        contentItem: {
          title: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  return where;
}

async function statFile(storageKey) {
  const absolutePath = getAbsolutePathFromStorageKey(storageKey);
  const stat = await fs.stat(absolutePath);

  return stat.isFile() ? stat : null;
}

async function safelyUnlinkStorageKey(storageKey) {
  try {
    await fs.unlink(getAbsolutePathFromStorageKey(storageKey));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function listDirectorySafe(directoryPath) {
  try {
    return await fs.readdir(directoryPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function toStorageKey(absolutePath) {
  return path.relative(uploadRoot, absolutePath).split(path.sep).join("/");
}

async function walkFiles(directoryPath, files = []) {
  const entries = await listDirectorySafe(directoryPath);

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      await walkFiles(absolutePath, files);
    } else if (entry.isFile()) {
      const stat = await fs.stat(absolutePath);
      files.push({
        storageKey: toStorageKey(absolutePath),
        fileName: entry.name,
        fileSizeBytes: stat.size,
      });
    }
  }

  return files;
}

async function scanUserStorageFiles(userId) {
  const contentItemIds = await getOwnedContentItemIds(userId);
  const files = [];

  if (contentItemIds.size === 0) {
    return files;
  }

  for (const [type, folder] of Object.entries(mediaTypeFolders)) {
    const typeDirectory = path.join(uploadRoot, folder);
    const contentDirectories = await listDirectorySafe(typeDirectory);

    for (const entry of contentDirectories) {
      if (!entry.isDirectory() || !contentItemIds.has(entry.name)) {
        continue;
      }

      const contentItemId = entry.name;
      const contentDirectory = path.join(typeDirectory, contentItemId);
      const contentFiles = await walkFiles(contentDirectory);

      for (const file of contentFiles) {
        files.push({
          ...file,
          type,
          contentItemId,
        });
      }
    }
  }

  return files;
}

async function getUserStorageFilesBestEffort(userId) {
  try {
    const files = await scanUserStorageFiles(userId);
    return {
      files,
      totalSizeBytes: files.reduce(
        (total, file) => total + file.fileSizeBytes,
        0
      ),
      error: null,
    };
  } catch (error) {
    return {
      files: [],
      totalSizeBytes: null,
      error: "Upload directory could not be scanned",
    };
  }
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

async function listAllMediaAssets(userId, query) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildMediaAssetWhere(userId, query);

  const [total, assets] = await prisma.$transaction([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where,
      skip,
      take: limit,
      select: mediaAssetSelect,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
    }),
  ]);

  return {
    data: assets,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

function emptyTypeMap(value = 0) {
  return {
    video: value,
    thumbnail: value,
    image: value,
    attachment: value,
  };
}

async function getStorageSummary(userId) {
  const where = {
    contentItem: {
      userId,
    },
  };

  const [totalDbMediaCount, totalSize, typeGroups, missingFileCount, deleted] =
    await prisma.$transaction([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.aggregate({
        where,
        _sum: {
          fileSizeBytes: true,
        },
      }),
      prisma.mediaAsset.groupBy({
        by: ["type"],
        where,
        _count: {
          _all: true,
        },
        _sum: {
          fileSizeBytes: true,
        },
      }),
      prisma.mediaAsset.count({
        where: {
          ...where,
          status: "missing",
        },
      }),
      prisma.mediaAsset.count({
        where: {
          ...where,
          status: "deleted",
        },
      }),
    ]);

  const countsByType = emptyTypeMap(0);
  const sizeByType = emptyTypeMap(0);

  for (const group of typeGroups) {
    countsByType[group.type] = group._count._all;
    sizeByType[group.type] = group._sum.fileSizeBytes || 0;
  }

  const uploadDirectory = await getUserStorageFilesBestEffort(userId);

  return {
    totalDbMediaCount,
    totalDbFileSizeBytes: totalSize._sum.fileSizeBytes || 0,
    countsByType,
    sizeByType,
    missingFileCount,
    deletedMediaCount: deleted,
    uploadDirectorySizeBytes: uploadDirectory.totalSizeBytes,
    uploadDirectorySizeError: uploadDirectory.error,
    uploadDirectorySizeIsUserScoped: true,
  };
}

async function scanStorage(userId) {
  const assets = await prisma.mediaAsset.findMany({
    where: {
      contentItem: {
        userId,
      },
    },
    select: scanAssetSelect,
  });
  const now = new Date();
  const markedMissing = [];
  const restoredActive = [];
  let alreadyMissingCount = 0;
  let deletedRecordCount = 0;

  for (const asset of assets) {
    if (asset.status === "deleted") {
      deletedRecordCount += 1;
      continue;
    }

    let exists = false;

    try {
      exists = Boolean(await statFile(asset.storageKey));
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    if (!exists && asset.status !== "missing") {
      await prisma.mediaAsset.update({
        where: {
          id: asset.id,
        },
        data: {
          status: "missing",
          missingDetectedAt: now,
        },
      });
      markedMissing.push({
        id: asset.id,
        storageKey: asset.storageKey,
        fileName: asset.fileName,
        type: asset.type,
        contentItemId: asset.contentItemId,
      });
    } else if (!exists) {
      alreadyMissingCount += 1;
      if (!asset.missingDetectedAt) {
        await prisma.mediaAsset.update({
          where: {
            id: asset.id,
          },
          data: {
            missingDetectedAt: now,
          },
        });
      }
    } else if (asset.status === "missing") {
      await prisma.mediaAsset.update({
        where: {
          id: asset.id,
        },
        data: {
          status: "active",
          missingDetectedAt: null,
        },
      });
      restoredActive.push({
        id: asset.id,
        storageKey: asset.storageKey,
        fileName: asset.fileName,
        type: asset.type,
        contentItemId: asset.contentItemId,
      });
    }
  }

  const uploadDirectory = await getUserStorageFilesBestEffort(userId);
  const knownStorageKeys = new Set(assets.map((asset) => asset.storageKey));
  const orphanFiles = uploadDirectory.files
    .filter((file) => !knownStorageKeys.has(file.storageKey))
    .map((file) => ({
      storageKey: file.storageKey,
      fileName: file.fileName,
      fileSizeBytes: file.fileSizeBytes,
      type: file.type,
      contentItemId: file.contentItemId,
    }));

  return {
    checkedDbMediaCount: assets.length,
    markedMissingCount: markedMissing.length,
    markedMissing,
    alreadyMissingCount,
    restoredActiveCount: restoredActive.length,
    restoredActive,
    deletedRecordCount,
    orphanFileCount: orphanFiles.length,
    orphanFiles,
    uploadDirectorySizeBytes: uploadDirectory.totalSizeBytes,
    uploadDirectoryScanError: uploadDirectory.error,
    scanMutatedDbRecords: true,
    physicalFilesDeleted: false,
  };
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
          id: true,
          status: true,
        },
      },
    },
  });

  if (!mediaAsset) {
    throw new ApiError(404, "Media asset not found");
  }

  if (mediaAsset.status === "deleted") {
    return prisma.mediaAsset.findUnique({
      where: {
        id,
      },
      select: mediaAssetSelect,
    });
  }

  const physicalFileDeleted = await safelyUnlinkStorageKey(
    mediaAsset.storageKey
  );

  const deletedAsset = await prisma.mediaAsset.update({
    where: {
      id,
    },
    data: {
      status: "deleted",
      deletedAt: new Date(),
    },
    select: mediaAssetSelect,
  });

  await recordNotificationEvent({
    userId,
    type: "media_deleted",
    title: "Media deleted",
    message: "A media asset was deleted.",
    severity: "warning",
    entityType: "media_asset",
    entityId: mediaAsset.id,
    payload: {
      contentItemId: mediaAsset.contentItemId,
      type: mediaAsset.type,
      fileName: mediaAsset.fileName,
      fileSizeBytes: mediaAsset.fileSizeBytes,
    },
  });

  return {
    ...deletedAsset,
    physicalFileDeleted,
  };
}

module.exports = {
  verifyContentItemAccess,
  createMediaAsset,
  listMediaAssets,
  listAllMediaAssets,
  getStorageSummary,
  scanStorage,
  deleteMediaAsset,
};
