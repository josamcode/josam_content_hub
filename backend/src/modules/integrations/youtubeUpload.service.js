const fs = require("fs");
const fsp = require("fs/promises");
const { google } = require("googleapis");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { getAbsolutePathFromStorageKey } = require("../../config/storage");
const ApiError = require("../../utils/apiError");
const { sendNotificationForEvent } = require("../email/email.service");
const {
  recordNotificationEvent,
} = require("../notifications/notification.service");
const { decryptToken, encryptToken } = require("../../utils/tokenCrypto");
const { YOUTUBE_UPLOAD_SCOPE } = require("./youtube.service");

const YOUTUBE_PLATFORM = "youtube";
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const ACTIVE_SCHEDULE_STATUSES = ["scheduled", "manual_pending", "processing"];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function ensureOAuthConfig() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new ApiError(500, "YouTube OAuth is not configured");
  }
}

function createOAuthClient() {
  ensureOAuthConfig();

  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

function buildWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean)
    .slice(0, 100);
}

function isNearExpiry(tokenExpiresAt) {
  if (!tokenExpiresAt) return false;

  return tokenExpiresAt.getTime() <= Date.now() + TOKEN_REFRESH_SKEW_MS;
}

function mapUploadPrivacyStatus(payload) {
  return payload.privacyStatus || env.youtubeUploadPrivacyStatus || "private";
}

function mapCategoryId(payload) {
  return payload.categoryId || env.youtubeDefaultCategoryId || undefined;
}

function getSafeErrorMessage(error, uploadRecovery) {
  if (uploadRecovery?.videoId) {
    return "YouTube upload completed but local save failed";
  }

  if (error instanceof ApiError) return error.message;
  return "YouTube upload failed";
}

function getSafeErrorStatus(error) {
  if (error instanceof ApiError) return error.statusCode;
  return 500;
}

function sanitizeYouTubeError(error, fallbackMessage) {
  const status = Number(error?.code || error?.response?.status) || 502;
  const details = error?.errors || error?.response?.data?.error?.errors || [];
  const firstDetail = Array.isArray(details) ? details[0] : null;
  const reason =
    firstDetail?.reason || error?.response?.data?.error?.status || undefined;
  const isQuota =
    reason === "quotaExceeded" ||
    reason === "dailyLimitExceeded" ||
    reason === "userRateLimitExceeded";
  const isAuth = status === 401 || reason === "authError";

  return {
    statusCode: isQuota ? 429 : isAuth ? 422 : status >= 500 ? 503 : 502,
    message: isQuota
      ? "YouTube quota limit reached"
      : isAuth
        ? "YouTube authorization failed; reconnect YouTube"
        : fallbackMessage || "YouTube upload failed",
    responsePayload: {
      youtubeStatus: status,
      youtubeReason: reason || null,
    },
  };
}

async function assertLocalFile(storageKey, label) {
  let absolutePath;

  try {
    absolutePath = getAbsolutePathFromStorageKey(storageKey);
    const stat = await fsp.stat(absolutePath);

    if (!stat.isFile()) {
      throw new Error(`${label} is not a file`);
    }

    return absolutePath;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new ApiError(422, `${label} file not found`);
    }

    if (error instanceof ApiError) throw error;

    throw new ApiError(422, `${label} file is not available`);
  }
}

async function getOwnedPlatformPost(userId, platformPostId) {
  const platformPost = await prisma.platformPost.findFirst({
    where: {
      id: platformPostId,
      contentItem: {
        userId,
      },
    },
    include: {
      contentItem: {
        select: {
          id: true,
          title: true,
        },
      },
      schedule: true,
    },
  });

  if (!platformPost) {
    throw new ApiError(404, "Platform post not found");
  }

  return platformPost;
}

async function getMediaAsset(contentItemId, type) {
  return prisma.mediaAsset.findFirst({
    where: {
      contentItemId,
      type,
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function assertStillNotUploaded(platformPostId) {
  const currentPost = await prisma.platformPost.findUnique({
    where: {
      id: platformPostId,
    },
    select: {
      platformPostUrl: true,
      status: true,
    },
  });

  if (!currentPost) {
    throw new ApiError(404, "Platform post not found");
  }

  if (currentPost.platformPostUrl) {
    throw new ApiError(409, "Platform post is already uploaded");
  }

  if (["manual_done", "published"].includes(currentPost.status)) {
    throw new ApiError(409, "Platform post is already completed");
  }
}

async function resolveSchedule(userId, platformPost, scheduleId) {
  if (scheduleId) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        platformPostId: platformPost.id,
        platformPost: {
          contentItem: {
            userId,
          },
        },
      },
    });

    if (!schedule) {
      throw new ApiError(404, "Schedule not found");
    }

    return schedule;
  }

  if (
    platformPost.schedule &&
    ACTIVE_SCHEDULE_STATUSES.includes(platformPost.schedule.status)
  ) {
    return platformPost.schedule;
  }

  return null;
}

function resolvePublishAt(schedule, privacyStatus) {
  if (!schedule) return null;

  if (schedule.status === "cancelled") {
    throw new ApiError(409, "Cancelled schedules cannot be uploaded");
  }

  if (schedule.scheduledAt <= new Date()) {
    throw new ApiError(422, "Scheduled YouTube uploads must be in the future");
  }

  if (privacyStatus !== "private") {
    throw new ApiError(
      422,
      "YouTube scheduled publishing requires private privacy status"
    );
  }

  return schedule.scheduledAt;
}

async function getConnectedYouTubeAccount(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: YOUTUBE_PLATFORM,
      },
    },
    select: {
      id: true,
      status: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      tokenExpiresAt: true,
      scopes: true,
    },
  });

  if (!account) {
    throw new ApiError(404, "Connected YouTube account not found");
  }

  if (account.status !== "connected") {
    throw new ApiError(422, "YouTube account is not connected");
  }

  if (!account.scopes.includes(YOUTUBE_UPLOAD_SCOPE)) {
    throw new ApiError(422, "YouTube upload scope is not granted");
  }

  return account;
}

async function markAccountNeedsReauth(accountId) {
  await prisma.platformAccount.update({
    where: {
      id: accountId,
    },
    data: {
      status: "needs_reauth",
      lastError: "YouTube token refresh failed",
    },
  });
}

function decryptStoredToken(payload) {
  if (!payload) return null;

  try {
    return decryptToken(payload);
  } catch (error) {
    throw new ApiError(500, "Stored YouTube tokens could not be decrypted");
  }
}

async function refreshAccessToken(account, oauth2Client, refreshToken) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const tokenResponse = await oauth2Client.getAccessToken();
    const accessToken =
      typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

    if (!accessToken) {
      throw new Error("No refreshed access token");
    }

    const credentials = oauth2Client.credentials;
    const tokenExpiresAt = credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : null;

    await prisma.platformAccount.update({
      where: {
        id: account.id,
      },
      data: {
        accessTokenEncrypted: encryptToken(accessToken),
        refreshTokenEncrypted: account.refreshTokenEncrypted,
        tokenExpiresAt,
        status: "connected",
        lastError: null,
      },
    });

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: credentials.expiry_date,
    });

    return accessToken;
  } catch (error) {
    await markAccountNeedsReauth(account.id);
    throw new ApiError(422, "YouTube account needs reconnect");
  }
}

async function getAuthorizedYouTubeClient(userId) {
  const account = await getConnectedYouTubeAccount(userId);
  const accessToken = decryptStoredToken(account.accessTokenEncrypted);
  const refreshToken = decryptStoredToken(account.refreshTokenEncrypted);
  const oauth2Client = createOAuthClient();

  if (!accessToken && !refreshToken) {
    await markAccountNeedsReauth(account.id);
    throw new ApiError(422, "YouTube account needs reconnect");
  }

  oauth2Client.setCredentials({
    access_token: accessToken || undefined,
    refresh_token: refreshToken || undefined,
    expiry_date: account.tokenExpiresAt
      ? account.tokenExpiresAt.getTime()
      : undefined,
  });

  if ((!accessToken || isNearExpiry(account.tokenExpiresAt)) && refreshToken) {
    await refreshAccessToken(account, oauth2Client, refreshToken);
  } else if (isNearExpiry(account.tokenExpiresAt) && !refreshToken) {
    await markAccountNeedsReauth(account.id);
    throw new ApiError(422, "YouTube account needs reconnect");
  }

  return {
    accountId: account.id,
    youtube: google.youtube({
      version: "v3",
      auth: oauth2Client,
    }),
  };
}

function buildVideoInsertRequest(platformPost, videoPath, payload, publishAt) {
  const categoryId = mapCategoryId(payload);
  const snippet = {
    title: platformPost.title.trim(),
    description: platformPost.description || "",
    tags: normalizeTags(platformPost.tags),
  };

  if (categoryId) {
    snippet.categoryId = categoryId;
  }

  const status = {
    privacyStatus: mapUploadPrivacyStatus(payload),
  };

  if (publishAt) {
    status.publishAt = publishAt.toISOString();
  }

  return {
    part: ["snippet", "status"],
    requestBody: {
      snippet,
      status,
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  };
}

async function uploadVideo(
  youtube,
  platformPost,
  videoPath,
  payload,
  publishAt,
  accountId
) {
  try {
    const response = await youtube.videos.insert(
      buildVideoInsertRequest(platformPost, videoPath, payload, publishAt)
    );
    const videoId = response?.data?.id;

    if (!videoId) {
      throw new Error("No YouTube video ID returned");
    }

    return videoId;
  } catch (error) {
    const safeError = sanitizeYouTubeError(error, "YouTube video upload failed");

    if (safeError.statusCode === 422 && accountId) {
      await markAccountNeedsReauth(accountId);
    }

    throw new ApiError(
      safeError.statusCode,
      safeError.message,
      safeError.responsePayload
    );
  }
}

async function uploadThumbnail(youtube, videoId, thumbnailAsset) {
  if (!thumbnailAsset) {
    return {
      thumbnailUploaded: false,
      thumbnailWarning: null,
    };
  }

  try {
    const thumbnailPath = await assertLocalFile(
      thumbnailAsset.storageKey,
      "Thumbnail"
    );

    await youtube.thumbnails.set({
      videoId,
      media: {
        body: fs.createReadStream(thumbnailPath),
      },
    });

    return {
      thumbnailUploaded: true,
      thumbnailWarning: null,
    };
  } catch (error) {
    return {
      thumbnailUploaded: false,
      thumbnailWarning: "Thumbnail upload failed; video upload completed",
    };
  }
}

function buildFailedAttemptPayload(error, uploadRecovery) {
  const payload = {
    statusCode: getSafeErrorStatus(error),
    details: error instanceof ApiError ? error.errors || null : null,
  };

  if (uploadRecovery?.videoId) {
    payload.youtubeUploadSucceeded = true;
    payload.videoId = uploadRecovery.videoId;
    payload.platformPostUrl = uploadRecovery.platformPostUrl;
    payload.platformPostUrlPersisted = Boolean(
      uploadRecovery.platformPostUrlPersisted
    );
    payload.persistenceWarning =
      "YouTube upload completed, but local success save did not finish";
  }

  return payload;
}

function buildNotificationFailurePayload(error, uploadRecovery) {
  return {
    platform: "YouTube",
    status: "failed",
    statusCode: getSafeErrorStatus(error),
    reason: error instanceof ApiError ? error.errors?.youtubeReason || null : null,
    errorMessage: getSafeErrorMessage(error, uploadRecovery),
  };
}

async function persistPlatformPostUrlAfterSaveFailure(
  platformPost,
  platformPostUrl
) {
  if (!platformPost || !platformPostUrl) {
    return false;
  }

  try {
    const result = await prisma.platformPost.updateMany({
      where: {
        id: platformPost.id,
        platformPostUrl: null,
      },
      data: {
        platformPostUrl,
      },
    });

    return result.count > 0;
  } catch (error) {
    return false;
  }
}

async function createFailedAttempt(
  platformPost,
  schedule,
  error,
  uploadRecovery
) {
  if (!platformPost || platformPost.platform !== YOUTUBE_PLATFORM) {
    return null;
  }

  try {
    return await prisma.publishAttempt.create({
      data: {
        platformPostId: platformPost.id,
        scheduleId: schedule ? schedule.id : null,
        platform: YOUTUBE_PLATFORM,
        status: "failed",
        publishMode: schedule ? schedule.publishMode : "manual",
        errorMessage: getSafeErrorMessage(error, uploadRecovery),
        responsePayload: buildFailedAttemptPayload(error, uploadRecovery),
      },
      select: {
        id: true,
      },
    });
  } catch (attemptError) {
    return null;
  }
}

async function saveUploadSuccess({
  platformPost,
  schedule,
  videoId,
  platformPostUrl,
  thumbnailUploaded,
  thumbnailWarning,
  publishAt,
}) {
  const isScheduledOnYouTube = Boolean(publishAt);
  const now = new Date();
  const responsePayload = {
    videoId,
    url: platformPostUrl,
    thumbnailUploaded,
    publishAt: publishAt ? publishAt.toISOString() : null,
  };

  if (thumbnailWarning) {
    responsePayload.thumbnailWarning = thumbnailWarning;
  }

  return prisma.$transaction(async (tx) => {
    await tx.platformPost.update({
      where: {
        id: platformPost.id,
      },
      data: {
        platformPostUrl,
        status: isScheduledOnYouTube ? "scheduled" : "published",
      },
    });

    if (schedule) {
      await tx.schedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          status: isScheduledOnYouTube ? "scheduled" : "published",
        },
      });

      await tx.reminder.updateMany({
        where: {
          scheduleId: schedule.id,
          status: {
            not: "done",
          },
        },
        data: {
          status: isScheduledOnYouTube ? "cancelled" : "done",
          completedAt: isScheduledOnYouTube ? undefined : now,
        },
      });
    }

    const publishAttempt = await tx.publishAttempt.create({
      data: {
        platformPostId: platformPost.id,
        scheduleId: schedule ? schedule.id : null,
        platform: YOUTUBE_PLATFORM,
        status: "success",
        publishMode: schedule ? schedule.publishMode : "manual",
        attemptedAt: now,
        responsePayload,
      },
      select: {
        id: true,
      },
    });

    return {
      publishAttemptId: publishAttempt.id,
      scheduleStatus: schedule
        ? isScheduledOnYouTube
          ? "scheduled"
          : "published"
        : null,
    };
  });
}

async function executeYouTubeUploadPipeline({
  userId,
  platformPost,
  schedule,
  payload,
  publishAt,
}) {
  let videoId = null;
  let platformPostUrl = null;

  try {
    if (platformPost.platform !== YOUTUBE_PLATFORM) {
      throw new ApiError(422, "Platform post is not a YouTube post");
    }

    if (platformPost.platformPostUrl) {
      throw new ApiError(409, "Platform post is already uploaded");
    }

    if (["manual_done", "published"].includes(platformPost.status)) {
      throw new ApiError(409, "Platform post is already completed");
    }

    if (!hasText(platformPost.title)) {
      throw new ApiError(422, "YouTube title is required");
    }

    const videoAsset = await getMediaAsset(platformPost.contentItemId, "video");

    if (!videoAsset) {
      throw new ApiError(422, "A video media asset is required");
    }

    const videoPath = await assertLocalFile(videoAsset.storageKey, "Video");
    const thumbnailAsset = await getMediaAsset(
      platformPost.contentItemId,
      "thumbnail"
    );
    const authorizedClient = await getAuthorizedYouTubeClient(userId);

    await assertStillNotUploaded(platformPost.id);

    videoId = await uploadVideo(
      authorizedClient.youtube,
      platformPost,
      videoPath,
      payload,
      publishAt,
      authorizedClient.accountId
    );
    platformPostUrl = buildWatchUrl(videoId);
    const thumbnailResult = await uploadThumbnail(
      authorizedClient.youtube,
      videoId,
      thumbnailAsset
    );
    const saved = await saveUploadSuccess({
      platformPost,
      schedule,
      videoId,
      platformPostUrl,
      thumbnailUploaded: thumbnailResult.thumbnailUploaded,
      thumbnailWarning: thumbnailResult.thumbnailWarning,
      publishAt,
    });

    const notificationEvent = await recordNotificationEvent({
      userId,
      type: "youtube_upload_success",
      title: "YouTube upload completed",
      message: "A YouTube upload completed successfully.",
      severity: "success",
      entityType: "platform_post",
      entityId: platformPost.id,
      payload: {
        platform: "YouTube",
        status: "success",
        contentTitle: platformPost.contentItem?.title || null,
        platformPostTitle: platformPost.title || null,
        scheduleId: schedule ? schedule.id : null,
        publishAttemptId: saved.publishAttemptId,
        publishMode: schedule ? schedule.publishMode : "manual",
        videoId,
        platformPostUrl,
      },
    });
    await sendNotificationForEvent(notificationEvent);

    return {
      platformPostId: platformPost.id,
      videoId,
      platformPostUrl,
      publishAttemptId: saved.publishAttemptId,
      thumbnailUploaded: thumbnailResult.thumbnailUploaded,
      publishAt: publishAt ? publishAt.toISOString() : null,
      scheduleStatus: saved.scheduleStatus,
    };
  } catch (error) {
    const platformPostUrlPersisted =
      videoId && platformPostUrl
        ? await persistPlatformPostUrlAfterSaveFailure(
            platformPost,
            platformPostUrl
          )
        : false;

    await createFailedAttempt(platformPost, schedule, error, {
      videoId,
      platformPostUrl,
      platformPostUrlPersisted,
    });
    const notificationEvent = await recordNotificationEvent({
      userId,
      type: "youtube_upload_failed",
      title: "YouTube upload failed",
      message: getSafeErrorMessage(error, {
        videoId,
        platformPostUrl,
        platformPostUrlPersisted,
      }),
      severity: "error",
      entityType: "platform_post",
      entityId: platformPost.id,
      payload: {
        ...buildNotificationFailurePayload(error, {
          videoId,
          platformPostUrl,
          platformPostUrlPersisted,
        }),
        contentTitle: platformPost.contentItem?.title || null,
        platformPostTitle: platformPost.title || null,
        publishMode: schedule ? schedule.publishMode : "manual",
        platformPostUrl,
      },
    });
    await sendNotificationForEvent(notificationEvent);
    throw error;
  }
}

async function uploadPlatformPost(userId, platformPostId, payload = {}) {
  const platformPost = await getOwnedPlatformPost(userId, platformPostId);
  const privacyStatus = mapUploadPrivacyStatus(payload);
  const schedule = await resolveSchedule(userId, platformPost, payload.scheduleId);
  const publishAt = resolvePublishAt(schedule, privacyStatus);

  return executeYouTubeUploadPipeline({
    userId,
    platformPost,
    schedule,
    payload,
    publishAt,
  });
}

async function uploadPlatformPostFromWorker({
  schedule,
  platformPost,
  userId,
  payload = {},
}) {
  return executeYouTubeUploadPipeline({
    userId,
    platformPost,
    schedule,
    payload,
    publishAt: null,
  });
}

module.exports = {
  uploadPlatformPost,
  uploadPlatformPostFromWorker,
};
