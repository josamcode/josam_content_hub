const prisma = require("../../config/prisma");
const env = require("../../config/env");
const ApiError = require("../../utils/apiError");
const {
  uploadPlatformPostFromWorker,
} = require("./youtubeUpload.service");

const YOUTUBE_PLATFORM = "youtube";
const STALE_PROCESSING_AFTER_MS = 30 * 60 * 1000;
const STALE_REQUEUE_DELAY_MS = 5 * 60 * 1000;
const RETRY_DELAYS_MS = [
  5 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
];
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
]);

function getSafeErrorMessage(error) {
  if (!error) return "YouTube upload failed";
  if (error instanceof ApiError) return error.message;
  if (typeof error.message === "string") return error.message.slice(0, 500);
  return "YouTube upload failed";
}

function getRetryDelayMs(attemptCount) {
  const index = Math.min(
    Math.max(attemptCount - 1, 0),
    RETRY_DELAYS_MS.length - 1
  );
  return RETRY_DELAYS_MS[index];
}

function isRetryableError(error) {
  if (!error) return false;

  const networkCode = error.code || error.cause?.code;
  if (networkCode && RETRYABLE_NETWORK_CODES.has(networkCode)) {
    return true;
  }

  const status =
    typeof error.statusCode === "number"
      ? error.statusCode
      : typeof error?.response?.status === "number"
        ? error.response.status
        : null;

  if (status !== null && status >= 500 && status < 600) {
    return true;
  }

  return false;
}

async function requeueStaleProcessingSchedules() {
  const now = Date.now();
  const threshold = new Date(now - STALE_PROCESSING_AFTER_MS);
  const nextAttemptAt = new Date(now + STALE_REQUEUE_DELAY_MS);

  const result = await prisma.schedule.updateMany({
    where: {
      status: "processing",
      publishMode: "auto",
      lastAttemptAt: { lt: threshold },
    },
    data: {
      status: "scheduled",
      nextAttemptAt,
      lastError: "Recovered stale processing schedule",
      attemptCount: { increment: 1 },
    },
  });

  return result.count;
}

async function claimDueYouTubeSchedules({ batchSize }) {
  const now = new Date();

  const candidates = await prisma.schedule.findMany({
    where: {
      status: "scheduled",
      publishMode: "auto",
      scheduledAt: { lte: now },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      platformPost: {
        platform: YOUTUBE_PLATFORM,
        platformPostUrl: null,
      },
    },
    take: batchSize,
    orderBy: { scheduledAt: "asc" },
    select: { id: true },
  });

  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((row) => row.id);

  await prisma.schedule.updateMany({
    where: {
      id: { in: candidateIds },
      status: "scheduled",
      publishMode: "auto",
    },
    data: {
      status: "processing",
      lastAttemptAt: now,
    },
  });

  return prisma.schedule.findMany({
    where: {
      id: { in: candidateIds },
      status: "processing",
      lastAttemptAt: now,
    },
  });
}

async function releaseScheduleForRetry(schedule, error) {
  const nextAttemptCount = (schedule.attemptCount || 0) + 1;
  const nextAttemptAt = new Date(Date.now() + getRetryDelayMs(nextAttemptCount));

  await prisma.schedule.update({
    where: { id: schedule.id },
    data: {
      status: "scheduled",
      attemptCount: nextAttemptCount,
      nextAttemptAt,
      lastError: getSafeErrorMessage(error),
    },
  });
}

async function markScheduleFailed(schedule, error) {
  const lastError = getSafeErrorMessage(error);

  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: { id: schedule.id },
      data: {
        status: "failed",
        attemptCount: (schedule.attemptCount || 0) + 1,
        lastError,
      },
    });

    await tx.platformPost.updateMany({
      where: {
        id: schedule.platformPostId,
        status: { notIn: ["manual_done", "published"] },
      },
      data: { status: "failed" },
    });
  });
}

async function loadPlatformPostForSchedule(schedule) {
  return prisma.platformPost.findUnique({
    where: { id: schedule.platformPostId },
    include: {
      contentItem: {
        select: {
          id: true,
          userId: true,
          title: true,
        },
      },
    },
  });
}

async function clearScheduleRetryMetadata(scheduleId) {
  try {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { lastError: null, nextAttemptAt: null },
    });
  } catch (error) {
    // Schedule may already be in a terminal state; ignore.
  }
}

async function processClaimedSchedule(scheduleOrId) {
  const schedule =
    typeof scheduleOrId === "string"
      ? await prisma.schedule.findUnique({ where: { id: scheduleOrId } })
      : scheduleOrId;

  if (!schedule) {
    return { ok: false, retryable: false, reason: "schedule_not_found" };
  }

  const platformPost = await loadPlatformPostForSchedule(schedule);

  if (!platformPost) {
    await markScheduleFailed(schedule, new Error("Platform post not found"));
    return { ok: false, retryable: false, scheduleId: schedule.id };
  }

  const userId = platformPost.contentItem?.userId;

  if (!userId) {
    await markScheduleFailed(schedule, new Error("Content owner not found"));
    return { ok: false, retryable: false, scheduleId: schedule.id };
  }

  try {
    const result = await uploadPlatformPostFromWorker({
      schedule,
      platformPost,
      userId,
    });

    await clearScheduleRetryMetadata(schedule.id);

    return {
      ok: true,
      scheduleId: schedule.id,
      videoId: result.videoId,
    };
  } catch (error) {
    const nextAttemptCount = (schedule.attemptCount || 0) + 1;
    const maxAttempts = env.youtubeAutoUploadWorkerMaxAttempts;

    if (isRetryableError(error) && nextAttemptCount < maxAttempts) {
      await releaseScheduleForRetry(schedule, error);
      return {
        ok: false,
        retryable: true,
        scheduleId: schedule.id,
        attemptCount: nextAttemptCount,
      };
    }

    await markScheduleFailed(schedule, error);
    return {
      ok: false,
      retryable: false,
      scheduleId: schedule.id,
      attemptCount: nextAttemptCount,
    };
  }
}

module.exports = {
  STALE_PROCESSING_AFTER_MS,
  RETRY_DELAYS_MS,
  requeueStaleProcessingSchedules,
  claimDueYouTubeSchedules,
  processClaimedSchedule,
  releaseScheduleForRetry,
  markScheduleFailed,
  isRetryableError,
};
