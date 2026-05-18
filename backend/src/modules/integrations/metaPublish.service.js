const fsp = require("fs/promises");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const { getAbsolutePathFromStorageKey } = require("../../config/storage");
const ApiError = require("../../utils/apiError");
const { decryptToken } = require("../../utils/tokenCrypto");
const {
  META_PLATFORM,
  buildGraphUrl,
} = require("./meta.service");
const {
  recordNotificationEvent,
} = require("../notifications/notification.service");
const { sendNotificationForEvent } = require("../email/email.service");

const FACEBOOK_PLATFORM = "facebook";

const META_AUTH_ERROR_CODES = [102, 190, 463, 467];

const ACTIVE_SCHEDULE_STATUSES = ["scheduled", "manual_pending", "processing"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildPublicUrl(storageKey) {
  if (!storageKey) return null;
  const base = env.publicUploadBaseUrl;
  if (!base) return null;
  const normalizedKey = storageKey.replace(/\\/g, "/");
  return `${base.replace(/\/+$/, "")}/${normalizedKey}`;
}

function buildFacebookPostUrl(pageId, responseId, postId, mediaType) {
  if (postId) {
    return `https://www.facebook.com/${postId}`;
  }

  if (mediaType === "video" && responseId) {
    return `https://www.facebook.com/${pageId}/videos/${responseId}`;
  }

  if (mediaType === "photo" && responseId) {
    return `https://www.facebook.com/${pageId}/photos/${responseId}`;
  }

  if (responseId) {
    return `https://www.facebook.com/${responseId}`;
  }

  return null;
}

function buildCaption(platformPost) {
  const parts = [];

  if (hasText(platformPost.caption)) {
    parts.push(platformPost.caption.trim());
  } else if (hasText(platformPost.description)) {
    parts.push(platformPost.description.trim());
  }

  if (Array.isArray(platformPost.hashtags) && platformPost.hashtags.length > 0) {
    const hashtagStr = platformPost.hashtags
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");
    parts.push(hashtagStr);
  }

  return parts.join("\n\n").trim();
}

function cleanSafeResponsePayload(payload) {
  const safe = { mode: "manual" };

  if (payload.pageId) safe.pageId = payload.pageId;
  if (payload.facebookPostId) safe.facebookPostId = payload.facebookPostId;
  if (payload.facebookPhotoId) safe.facebookPhotoId = payload.facebookPhotoId;
  if (payload.facebookVideoId) safe.facebookVideoId = payload.facebookVideoId;
  if (payload.platformPostUrl) safe.platformPostUrl = payload.platformPostUrl;
  if (payload.mediaType) safe.mediaType = payload.mediaType;

  return safe;
}

function getSafeErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return "Facebook publish failed";
}

// ---------------------------------------------------------------------------
// Graph API
// ---------------------------------------------------------------------------

async function postToFacebookApi(path, accessToken, body) {
  const url = buildGraphUrl(path, { access_token: accessToken });

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(502, "Failed to reach Meta API");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, "Invalid response from Meta API");
  }

  if (data && data.error) {
    const code = data.error.code;
    const message = data.error.message || "Meta API request failed";

    if (META_AUTH_ERROR_CODES.includes(code)) {
      const authError = new ApiError(422, `Meta authorization failed: ${message}`);
      authError.isMetaAuthError = true;
      authError.metaErrorCode = code;
      throw authError;
    }

    throw new ApiError(502, `Meta API error: ${message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Ownership & validation
// ---------------------------------------------------------------------------

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

async function findMediaAsset(contentItemId) {
  const videoAsset = await prisma.mediaAsset.findFirst({
    where: { contentItemId, type: "video", status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (videoAsset) return { asset: videoAsset, mediaType: "video" };

  const imageAsset = await prisma.mediaAsset.findFirst({
    where: { contentItemId, type: "image", status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (imageAsset) return { asset: imageAsset, mediaType: "image" };

  const thumbnailAsset = await prisma.mediaAsset.findFirst({
    where: { contentItemId, type: "thumbnail", status: "active" },
    orderBy: { createdAt: "desc" },
  });

  if (thumbnailAsset) return { asset: thumbnailAsset, mediaType: "image" };

  return null;
}

async function assertLocalFile(storageKey, label) {
  try {
    const absolutePath = getAbsolutePathFromStorageKey(storageKey);
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

async function getConnectedFacebookAccount(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: FACEBOOK_PLATFORM,
      },
    },
    select: {
      id: true,
      status: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      metadata: true,
    },
  });

  if (!account || account.status !== "connected") {
    throw new ApiError(422, "Meta account is not connected");
  }

  if (!account.accessTokenEncrypted) {
    throw new ApiError(422, "Meta account is not connected");
  }

  const metadata = account.metadata || {};
  if (!metadata.selectedPageId) {
    throw new ApiError(422, "Facebook Page is not selected");
  }

  return account;
}

async function markAccountNeedsReauth(accountId) {
  try {
    await prisma.platformAccount.update({
      where: { id: accountId },
      data: {
        status: "needs_reauth",
        lastError: "Facebook publish authorization failed",
      },
    });
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Publish to Facebook
// ---------------------------------------------------------------------------

async function publishToFacebook({ pageId, accessToken, caption, mediaUrl, mediaType }) {
  if (mediaType === "video" && mediaUrl) {
    const body = { file_url: mediaUrl };
    if (caption) body.description = caption;

    return postToFacebookApi(`${pageId}/videos`, accessToken, body);
  }

  if ((mediaType === "image" || mediaType === "photo") && mediaUrl) {
    const body = { url: mediaUrl };
    if (caption) body.caption = caption;

    return postToFacebookApi(`${pageId}/photos`, accessToken, body);
  }

  // Text-only fallback
  if (caption) {
    const body = { message: caption };
    return postToFacebookApi(`${pageId}/feed`, accessToken, body);
  }

  throw new ApiError(422, "No media or caption to publish");
}

function extractIdsFromResponse(responseData, pageId, mediaType) {
  const responseId = responseData.id || null;
  const postId = responseData.post_id || null;

  let facebookPostId = null;
  let facebookVideoId = null;
  let facebookPhotoId = null;

  if (mediaType === "video" && responseId) {
    facebookVideoId = responseId;
  } else if (mediaType === "image" && responseId) {
    facebookPhotoId = responseId;
    facebookPostId = postId || null;
  } else if (!mediaType && responseId) {
    facebookPostId = responseId;
  }

  return { responseId, postId, facebookPostId, facebookVideoId, facebookPhotoId };
}

// ---------------------------------------------------------------------------
// Transaction helpers
// ---------------------------------------------------------------------------

async function savePublishSuccess({ platformPost, schedule, pageId, responseData, mediaType }) {
  const { responseId, postId, facebookPostId, facebookVideoId, facebookPhotoId } =
    extractIdsFromResponse(responseData, pageId, mediaType);

  const platformPostUrl = buildFacebookPostUrl(pageId, responseId, postId, mediaType);

  if (!platformPostUrl) {
    throw new ApiError(502, "Facebook did not return a valid post identifier");
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.platformPost.update({
      where: { id: platformPost.id },
      data: {
        platformPostUrl,
        status: "published",
      },
    });

    if (schedule) {
      await tx.schedule.update({
        where: { id: schedule.id },
        data: { status: "published" },
      });

      await tx.reminder.updateMany({
        where: {
          scheduleId: schedule.id,
          status: { not: "done" },
        },
        data: {
          status: "done",
          completedAt: now,
        },
      });
    }

    const publishAttempt = await tx.publishAttempt.create({
      data: {
        platformPostId: platformPost.id,
        scheduleId: schedule ? schedule.id : null,
        platform: FACEBOOK_PLATFORM,
        status: "success",
        publishMode: schedule ? schedule.publishMode : "manual",
        attemptedAt: now,
        responsePayload: cleanSafeResponsePayload({
          pageId,
          facebookPostId,
          facebookPhotoId,
          facebookVideoId,
          platformPostUrl,
          mediaType,
        }),
      },
      select: { id: true, status: true, attemptedAt: true },
    });

    return {
      platformPost: {
        id: platformPost.id,
        status: "published",
        platformPostUrl,
      },
      publishAttempt,
      platformPostUrl,
    };
  });

  return result;
}

async function savePublishFailure({ platformPost, schedule, error }) {
  const errorMessage = getSafeErrorMessage(error);

  try {
    await prisma.publishAttempt.create({
      data: {
        platformPostId: platformPost.id,
        scheduleId: schedule ? schedule.id : null,
        platform: FACEBOOK_PLATFORM,
        status: "failed",
        publishMode: schedule ? schedule.publishMode : "manual",
        errorMessage,
        responsePayload: {},
      },
      select: { id: true },
    });
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function publishFacebookPlatformPost({ userId, platformPostId }) {
  let platformPost;
  let schedule = null;
  let account = null;

  try {
    // 1. Ownership + platform validation
    platformPost = await getOwnedPlatformPost(userId, platformPostId);

    if (platformPost.platform !== FACEBOOK_PLATFORM) {
      throw new ApiError(422, "Platform post is not a Facebook post");
    }

    // 2. Duplicate protection
    if (platformPost.platformPostUrl) {
      throw new ApiError(409, "Platform post is already published");
    }

    if (["manual_done", "published"].includes(platformPost.status)) {
      throw new ApiError(409, "Platform post is already completed");
    }

    // 3. Content validation
    if (!hasText(platformPost.caption) && !hasText(platformPost.description)) {
      throw new ApiError(422, "Facebook caption is required");
    }

    const mediaResult = await findMediaAsset(platformPost.contentItemId);
    if (!mediaResult) {
      throw new ApiError(422, "At least one media asset is required");
    }

    const { asset: mediaAsset, mediaType } = mediaResult;

    // 4. Local file check
    await assertLocalFile(mediaAsset.storageKey, mediaType === "video" ? "Video" : "Image");

    // 5. Build public URL
    const publicUrl = buildPublicUrl(mediaAsset.storageKey);
    if (!publicUrl) {
      throw new ApiError(500, "Public upload base URL is not configured");
    }

    // 6. Account validation
    account = await getConnectedFacebookAccount(userId);
    const metadata = account.metadata || {};
    const pageId = metadata.selectedPageId;

    let accessToken;
    try {
      accessToken = decryptToken(account.accessTokenEncrypted);
    } catch {
      throw new ApiError(422, "Meta account is not connected");
    }

    // 7. Resolve schedule (if any active schedule on this platform post)
    if (
      platformPost.schedule &&
      ACTIVE_SCHEDULE_STATUSES.includes(platformPost.schedule.status)
    ) {
      schedule = platformPost.schedule;
    }

    // 8. Publish to Facebook
    const caption = buildCaption(platformPost);
    const responseData = await publishToFacebook({
      pageId,
      accessToken,
      caption,
      mediaUrl: publicUrl,
      mediaType,
    });

    // 9. Save success
    const result = await savePublishSuccess({
      platformPost,
      schedule,
      pageId,
      responseData,
      mediaType,
    });

    // 10. Notification (best-effort — must not rollback success)
    try {
      const notificationEvent = await recordNotificationEvent({
        userId,
        type: "facebook_publish_success",
        title: "Facebook publish completed",
        message: "A Facebook post was published successfully.",
        severity: "success",
        entityType: "platform_post",
        entityId: platformPost.id,
        payload: {
          platform: "Facebook",
          status: "success",
          contentTitle: platformPost.contentItem?.title || null,
          platformPostTitle: platformPost.title || null,
          scheduleId: schedule ? schedule.id : null,
          publishAttemptId: result.publishAttempt.id,
          publishMode: schedule ? schedule.publishMode : "manual",
          platformPostUrl: result.platformPostUrl,
        },
      });
      await sendNotificationForEvent(notificationEvent);
    } catch {
      // best-effort
    }

    return result;
  } catch (error) {
    // Mark account as needs_reauth on Meta auth errors
    if (error.isMetaAuthError && account) {
      await markAccountNeedsReauth(account.id);
    }

    // Save failed attempt if we have a platform post
    if (platformPost) {
      await savePublishFailure({ platformPost, schedule, error });
    }

    // Notification for failure
    if (platformPost && userId) {
      try {
        const notificationEvent = await recordNotificationEvent({
          userId,
          type: "facebook_publish_failed",
          title: "Facebook publish failed",
          message: getSafeErrorMessage(error),
          severity: "error",
          entityType: "platform_post",
          entityId: platformPost.id,
          payload: {
            platform: "Facebook",
            status: "failed",
            statusCode: error instanceof ApiError ? error.statusCode : 500,
            errorMessage: getSafeErrorMessage(error),
            contentTitle: platformPost.contentItem?.title || null,
            platformPostTitle: platformPost.title || null,
            publishMode: schedule ? schedule.publishMode : "manual",
          },
        });
        await sendNotificationForEvent(notificationEvent);
      } catch {
        // best-effort
      }
    }

    throw error;
  }
}

module.exports = {
  publishFacebookPlatformPost,
};
