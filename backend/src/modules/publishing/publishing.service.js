const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const completablePlatformPostStatuses = [
  "failed",
  "ready",
  "scheduled",
  "manual_pending",
];

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function toDate(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(422, `Invalid ${fieldName}`);
  }

  return date;
}

function parseDateRange(query) {
  const range = {};

  if (query.from) {
    range.gte = toDate(query.from, "from date");
  }

  if (query.to) {
    range.lte = toDate(query.to, "to date");
  }

  if (range.gte && range.lte && range.gte > range.lte) {
    throw new ApiError(422, "From date must be before to date");
  }

  return range;
}

function buildAttemptsWhere(userId, query) {
  const where = {
    platformPost: {
      contentItem: {
        userId,
      },
    },
  };

  if (query.platform) {
    where.platform = query.platform;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.platformPostId) {
    where.platformPostId = query.platformPostId;
  }

  const attemptedAt = parseDateRange(query);

  if (Object.keys(attemptedAt).length > 0) {
    where.attemptedAt = attemptedAt;
  }

  return where;
}

function toPublishAttemptListItem(attempt) {
  return {
    id: attempt.id,
    contentTitle: attempt.platformPost.contentItem.title,
    contentItemId: attempt.platformPost.contentItem.id,
    platformPostId: attempt.platformPostId,
    scheduleId: attempt.scheduleId,
    platform: attempt.platform,
    publishMode: attempt.publishMode,
    status: attempt.status,
    errorMessage: attempt.errorMessage,
    attemptedAt: attempt.attemptedAt,
    platformPostUrl: attempt.platformPost.platformPostUrl,
  };
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
      schedule: {
        include: {
          reminder: true,
        },
      },
    },
  });

  if (!platformPost) {
    throw new ApiError(404, "Platform post not found");
  }

  return platformPost;
}

async function resolveSchedule(userId, platformPost, scheduleId) {
  if (!scheduleId) {
    return platformPost.schedule || null;
  }

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
    include: {
      reminder: true,
    },
  });

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  return schedule;
}

async function manualComplete(userId, payload) {
  const platformPost = await getOwnedPlatformPost(userId, payload.platformPostId);
  const schedule = await resolveSchedule(
    userId,
    platformPost,
    payload.scheduleId
  );

  if (["manual_done", "published"].includes(platformPost.status)) {
    throw new ApiError(409, "Platform post is already completed");
  }

  if (!completablePlatformPostStatuses.includes(platformPost.status)) {
    throw new ApiError(409, "Platform post is not ready for manual completion");
  }

  if (schedule && schedule.status === "cancelled") {
    throw new ApiError(409, "Cancelled schedules cannot be completed");
  }

  const now = new Date();
  const shouldUpdateUrl = hasOwn(payload, "platformPostUrl");
  const platformPostData = {
    status: "manual_done",
  };

  if (shouldUpdateUrl) {
    platformPostData.platformPostUrl = payload.platformPostUrl;
  }

  return prisma.$transaction(async (tx) => {
    const updatedPlatformPost = await tx.platformPost.update({
      where: {
        id: platformPost.id,
      },
      data: platformPostData,
      select: {
        id: true,
        status: true,
        platformPostUrl: true,
      },
    });

    if (schedule) {
      await tx.schedule.update({
        where: {
          id: schedule.id,
        },
        data: {
          status: "manual_done",
        },
      });

      await tx.reminder.updateMany({
        where: {
          scheduleId: schedule.id,
        },
        data: {
          status: "done",
          completedAt: now,
        },
      });
    }

    const responsePayload = shouldUpdateUrl
      ? {
          platformPostUrl: payload.platformPostUrl,
        }
      : undefined;

    const publishAttempt = await tx.publishAttempt.create({
      data: {
        platformPostId: platformPost.id,
        scheduleId: schedule ? schedule.id : null,
        platform: platformPost.platform,
        status: "manual_completed",
        publishMode: "manual",
        attemptedAt: now,
        responsePayload,
      },
      select: {
        id: true,
        status: true,
        attemptedAt: true,
      },
    });

    return {
      platformPostId: updatedPlatformPost.id,
      status: updatedPlatformPost.status,
      platformPostUrl: updatedPlatformPost.platformPostUrl,
      publishAttempt,
    };
  });
}

async function listPublishAttempts(userId, query) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildAttemptsWhere(userId, query);

  const [total, attempts] = await prisma.$transaction([
    prisma.publishAttempt.count({ where }),
    prisma.publishAttempt.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        attemptedAt: "desc",
      },
      include: {
        platformPost: {
          select: {
            id: true,
            platformPostUrl: true,
            contentItem: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    data: attempts.map(toPublishAttemptListItem),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  manualComplete,
  listPublishAttempts,
};
