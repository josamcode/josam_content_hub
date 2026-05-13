const prisma = require("../../config/prisma");
const platformRules = require("../../rules/platformRules");
const ApiError = require("../../utils/apiError");

const scheduleSelect = {
  id: true,
  platformPostId: true,
  scheduledAt: true,
  timezone: true,
  publishMode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const platformPostValidationSelect = {
  id: true,
  platform: true,
  title: true,
  caption: true,
  description: true,
  hashtags: true,
  tags: true,
  contentItem: {
    select: {
      title: true,
    },
  },
};

const reminderPublishModes = ["manual", "reminder"];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatPlatformName(platform) {
  const names = {
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
  };

  return names[platform] || platform;
}

function buildPlatformPostValidationResult(platformPost) {
  const rules = platformRules[platformPost.platform] || {};
  const warnings = [];
  const checks = {
    platform: platformPost.platform,
    hasTitle: hasText(platformPost.title),
    hasCaption: hasText(platformPost.caption),
    hasDescription: hasText(platformPost.description),
    hasHashtags:
      Array.isArray(platformPost.hashtags) && platformPost.hashtags.length > 0,
    hasTags: Array.isArray(platformPost.tags) && platformPost.tags.length > 0,
  };

  if (rules.requiresTitle && !checks.hasTitle) {
    warnings.push({
      field: "title",
      message: `Title is required for ${formatPlatformName(
        platformPost.platform
      )}`,
    });
  }

  if (rules.requiresCaption && !checks.hasCaption) {
    warnings.push({
      field: "caption",
      message: `Caption is required for ${formatPlatformName(
        platformPost.platform
      )}`,
    });
  }

  return {
    valid: warnings.length === 0,
    warnings,
    checks,
  };
}

function toDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(422, "Invalid calendar date range");
  }

  return date;
}

function getDefaultCalendarRange(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );

  return { start, end };
}

function parseCalendarDate(value, boundary) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toDate(
      boundary === "end"
        ? `${value}T23:59:59.999Z`
        : `${value}T00:00:00.000Z`
    );
  }

  return toDate(value);
}

function getCalendarRange(query) {
  const defaults = getDefaultCalendarRange();
  const start = parseCalendarDate(query.from, "start") || defaults.start;
  const end = parseCalendarDate(query.to, "end") || defaults.end;

  if (start > end) {
    throw new ApiError(422, "Calendar from date must be before to date");
  }

  return { start, end };
}

function isReminderPublishMode(publishMode) {
  return reminderPublishModes.includes(publishMode);
}

function getScheduleStatusForPublishMode(publishMode) {
  return isReminderPublishMode(publishMode) ? "manual_pending" : "scheduled";
}

function buildReminderPayload(schedule, platformPost) {
  const contentTitle = platformPost.contentItem.title;

  return {
    title: `Publish "${contentTitle}" on ${platformPost.platform}`,
    message: `Manual publishing reminder for "${contentTitle}" on ${platformPost.platform}. Copy the caption/hashtags and publish it manually.`,
    remindAt: schedule.scheduledAt,
    status: "pending",
    completedAt: null,
  };
}

async function upsertPendingReminder(tx, schedule, platformPost) {
  const reminderPayload = buildReminderPayload(schedule, platformPost);

  return tx.reminder.upsert({
    where: {
      scheduleId: schedule.id,
    },
    update: reminderPayload,
    create: {
      ...reminderPayload,
      scheduleId: schedule.id,
    },
  });
}

async function cancelReminder(tx, scheduleId) {
  return tx.reminder.updateMany({
    where: {
      scheduleId,
    },
    data: {
      status: "cancelled",
    },
  });
}

async function getOwnedPlatformPost(userId, id) {
  const platformPost = await prisma.platformPost.findFirst({
    where: {
      id,
      contentItem: {
        userId,
      },
    },
    select: platformPostValidationSelect,
  });

  if (!platformPost) {
    throw new ApiError(404, "Platform post not found");
  }

  return platformPost;
}

async function getOwnedSchedule(userId, id) {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id,
      platformPost: {
        contentItem: {
          userId,
        },
      },
    },
    include: {
      platformPost: {
        select: {
          id: true,
          status: true,
          platform: true,
          contentItem: {
            select: {
              title: true,
            },
          },
        },
      },
      reminder: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  return schedule;
}

async function saveSchedule(userId, platformPostId, payload) {
  const platformPost = await getOwnedPlatformPost(userId, platformPostId);
  const validationResult = buildPlatformPostValidationResult(platformPost);
  const nextStatus = getScheduleStatusForPublishMode(payload.publishMode);

  if (!validationResult.valid) {
    throw new ApiError(
      422,
      "Platform post validation failed",
      validationResult
    );
  }

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.upsert({
      where: {
        platformPostId,
      },
      update: {
        scheduledAt: new Date(payload.scheduledAt),
        timezone: payload.timezone,
        publishMode: payload.publishMode,
        status: nextStatus,
      },
      create: {
        platformPostId,
        scheduledAt: new Date(payload.scheduledAt),
        timezone: payload.timezone,
        publishMode: payload.publishMode,
        status: nextStatus,
      },
      select: scheduleSelect,
    });

    await tx.platformPost.update({
      where: {
        id: platformPostId,
      },
      data: {
        status: nextStatus,
      },
    });

    if (isReminderPublishMode(payload.publishMode)) {
      await upsertPendingReminder(tx, schedule, platformPost);
    } else {
      await cancelReminder(tx, schedule.id);
    }

    return schedule;
  });
}

async function updateSchedule(userId, id, payload) {
  const existingSchedule = await getOwnedSchedule(userId, id);

  const data = { ...payload };
  const hasPublishMode = Object.prototype.hasOwnProperty.call(
    payload,
    "publishMode"
  );
  const hasStatus = Object.prototype.hasOwnProperty.call(payload, "status");
  const hasScheduledAt = Object.prototype.hasOwnProperty.call(
    payload,
    "scheduledAt"
  );

  if (data.scheduledAt) {
    data.scheduledAt = new Date(data.scheduledAt);
  }

  if (hasPublishMode && !hasStatus) {
    data.status = getScheduleStatusForPublishMode(payload.publishMode);
  }

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.schedule.update({
      where: {
        id,
      },
      data,
      select: scheduleSelect,
    });

    if (hasPublishMode) {
      const nextStatus = getScheduleStatusForPublishMode(payload.publishMode);

      await tx.platformPost.update({
        where: {
          id: schedule.platformPostId,
        },
        data: {
          status: nextStatus,
        },
      });

      if (isReminderPublishMode(payload.publishMode)) {
        await upsertPendingReminder(tx, schedule, existingSchedule.platformPost);
      } else {
        await cancelReminder(tx, schedule.id);
      }
    } else if (
      hasScheduledAt &&
      existingSchedule.reminder &&
      existingSchedule.reminder.status !== "done"
    ) {
      await tx.reminder.update({
        where: {
          scheduleId: schedule.id,
        },
        data: {
          remindAt: schedule.scheduledAt,
        },
      });
    }

    return schedule;
  });
}

async function cancelSchedule(userId, id) {
  const schedule = await getOwnedSchedule(userId, id);

  await prisma.$transaction(async (tx) => {
    await tx.schedule.update({
      where: {
        id,
      },
      data: {
        status: "cancelled",
      },
    });

    await cancelReminder(tx, id);

    if (["scheduled", "manual_pending"].includes(schedule.platformPost.status)) {
      await tx.platformPost.update({
        where: {
          id: schedule.platformPostId,
        },
        data: {
          status: "ready",
        },
      });
    }
  });
}

async function listCalendar(userId, query) {
  const { start, end } = getCalendarRange(query);
  const where = {
    scheduledAt: {
      gte: start,
      lte: end,
    },
    platformPost: {
      contentItem: {
        userId,
      },
    },
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.platform) {
    where.platformPost.platform = query.platform;
  }

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: {
      scheduledAt: "asc",
    },
    include: {
      platformPost: {
        select: {
          id: true,
          platform: true,
          status: true,
          contentItem: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return schedules.map((schedule) => ({
    id: schedule.id,
    platformPostId: schedule.platformPostId,
    contentItemId: schedule.platformPost.contentItem.id,
    contentTitle: schedule.platformPost.contentItem.title,
    contentStatus: schedule.platformPost.contentItem.status,
    platform: schedule.platformPost.platform,
    scheduledAt: schedule.scheduledAt,
    timezone: schedule.timezone,
    publishMode: schedule.publishMode,
    status: schedule.status,
    platformPostStatus: schedule.platformPost.status,
  }));
}

module.exports = {
  saveSchedule,
  updateSchedule,
  cancelSchedule,
  listCalendar,
};
