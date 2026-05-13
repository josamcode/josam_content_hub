const prisma = require("../../config/prisma");
const platformRules = require("../../rules/platformRules");

const contentItemStatuses = [
  "idea",
  "scripted",
  "recorded",
  "edited",
  "ready",
  "scheduled",
  "published",
  "failed",
  "archived",
];

const platformPostStatuses = [
  "draft",
  "ready",
  "scheduled",
  "published",
  "failed",
  "manual_pending",
  "manual_done",
];

const scheduleSummaryStatuses = {
  scheduled: "scheduled",
  manualPending: "manual_pending",
  manualDone: "manual_done",
  cancelled: "cancelled",
  failed: "failed",
};

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

function getTimeZoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

function localTimeToUtcDate(timeZone, localParts) {
  let utcTime = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    localParts.second,
    localParts.millisecond
  );

  for (let index = 0; index < 3; index += 1) {
    const actualParts = getTimeZoneParts(new Date(utcTime), timeZone);
    const actualLocalTime = Date.UTC(
      actualParts.year,
      actualParts.month - 1,
      actualParts.day,
      actualParts.hour,
      actualParts.minute,
      actualParts.second,
      localParts.millisecond
    );
    const expectedLocalTime = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second,
      localParts.millisecond
    );

    utcTime -= actualLocalTime - expectedLocalTime;
  }

  return new Date(utcTime);
}

function getTodayRange(timeZone, now = new Date()) {
  const today = getTimeZoneParts(now, timeZone);
  const start = localTimeToUtcDate(timeZone, {
    ...today,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const end = localTimeToUtcDate(timeZone, {
    ...today,
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  });

  return { start, end };
}

function getMonthRange(now = new Date()) {
  return {
    start: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    ),
    end: new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    ),
  };
}

function initializeCounts(keys) {
  return keys.reduce((counts, key) => {
    counts[key] = 0;
    return counts;
  }, {});
}

function groupCountsToStatusMap(groupCounts, keys, fieldName) {
  const counts = initializeCounts(keys);

  groupCounts.forEach((item) => {
    counts[item[fieldName]] = item._count._all;
  });

  return counts;
}

function toReminderSummary(reminder) {
  const platformPost = reminder.schedule.platformPost;

  return {
    id: reminder.id,
    title: reminder.title,
    remindAt: reminder.remindAt,
    status: reminder.status,
    platform: platformPost.platform,
    contentTitle: platformPost.contentItem.title,
    platformPostId: platformPost.id,
    scheduleId: reminder.schedule.id,
  };
}

function toOverdueReminderSummary(reminder) {
  const summary = toReminderSummary(reminder);
  delete summary.status;
  return summary;
}

function toUpcomingPost(schedule) {
  return {
    id: schedule.id,
    platformPostId: schedule.platformPostId,
    contentItemId: schedule.platformPost.contentItem.id,
    contentTitle: schedule.platformPost.contentItem.title,
    platform: schedule.platformPost.platform,
    scheduledAt: schedule.scheduledAt,
    timezone: schedule.timezone,
    publishMode: schedule.publishMode,
    status: schedule.status,
    platformPostStatus: schedule.platformPost.status,
  };
}

function toRecentPublishAttempt(attempt) {
  return {
    id: attempt.id,
    contentTitle: attempt.platformPost.contentItem.title,
    contentItemId: attempt.platformPost.contentItem.id,
    platformPostId: attempt.platformPostId,
    scheduleId: attempt.scheduleId,
    platform: attempt.platform,
    publishMode: attempt.publishMode,
    status: attempt.status,
    attemptedAt: attempt.attemptedAt,
    platformPostUrl: attempt.platformPost.platformPostUrl,
  };
}

function createNeedsAttentionItem({
  type,
  severity = "warning",
  contentItemId,
  platformPostId,
  scheduleId = null,
  reminderId = null,
  platform,
  title,
  message,
}) {
  return {
    type,
    severity,
    contentItemId,
    platformPostId,
    scheduleId,
    reminderId,
    platform,
    title,
    message,
  };
}

function buildReadyNotScheduledAttentionItems(platformPosts) {
  return platformPosts.map((post) =>
    createNeedsAttentionItem({
      type: "ready_not_scheduled",
      contentItemId: post.contentItem.id,
      platformPostId: post.id,
      scheduleId: post.schedule ? post.schedule.id : null,
      platform: post.platform,
      title: post.contentItem.title,
      message: `${formatPlatformName(
        post.platform
      )} version is ready but not scheduled.`,
    })
  );
}

function buildManualOverdueAttentionItems(reminders) {
  return reminders.map((reminder) =>
    createNeedsAttentionItem({
      type: "manual_publish_overdue",
      severity: "critical",
      contentItemId: reminder.schedule.platformPost.contentItem.id,
      platformPostId: reminder.schedule.platformPost.id,
      scheduleId: reminder.schedule.id,
      reminderId: reminder.id,
      platform: reminder.schedule.platformPost.platform,
      title: reminder.schedule.platformPost.contentItem.title,
      message: `${formatPlatformName(
        reminder.schedule.platformPost.platform
      )} manual publishing reminder is overdue.`,
    })
  );
}

function buildFailedPlatformPostAttentionItems(platformPosts) {
  return platformPosts.map((post) =>
    createNeedsAttentionItem({
      type: "failed_platform_post",
      severity: "critical",
      contentItemId: post.contentItem.id,
      platformPostId: post.id,
      platform: post.platform,
      title: post.contentItem.title,
      message: `${formatPlatformName(post.platform)} version is marked failed.`,
    })
  );
}

function buildFailedScheduleAttentionItems(schedules) {
  return schedules.map((schedule) =>
    createNeedsAttentionItem({
      type: "failed_schedule",
      severity: "critical",
      contentItemId: schedule.platformPost.contentItem.id,
      platformPostId: schedule.platformPost.id,
      scheduleId: schedule.id,
      platform: schedule.platformPost.platform,
      title: schedule.platformPost.contentItem.title,
      message: `${formatPlatformName(
        schedule.platformPost.platform
      )} schedule is marked failed.`,
    })
  );
}

function buildMissingTextAttentionItems(platformPosts) {
  return platformPosts
    .filter((post) => {
      const rules = platformRules[post.platform] || {};

      if (rules.requiresTitle && !hasText(post.title)) {
        return true;
      }

      if (rules.requiresCaption && !hasText(post.caption)) {
        return true;
      }

      return false;
    })
    .map((post) =>
      createNeedsAttentionItem({
        type: "draft_platform_missing_text",
        contentItemId: post.contentItem.id,
        platformPostId: post.id,
        platform: post.platform,
        title: post.contentItem.title,
        message: `${formatPlatformName(
          post.platform
        )} draft is missing required text.`,
      })
    );
}

function buildNeedsAttention({
  readyNotScheduledPosts,
  overdueReminders,
  failedPlatformPosts,
  failedSchedules,
  draftPlatformPosts,
}) {
  return [
    ...buildManualOverdueAttentionItems(overdueReminders),
    ...buildFailedPlatformPostAttentionItems(failedPlatformPosts),
    ...buildFailedScheduleAttentionItems(failedSchedules),
    ...buildReadyNotScheduledAttentionItems(readyNotScheduledPosts),
    ...buildMissingTextAttentionItems(draftPlatformPosts),
  ];
}

async function getDashboard(userId, query) {
  const now = new Date();
  const todayRange = getTodayRange(query.timezone, now);
  const monthRange = getMonthRange(now);

  const userContentWhere = {
    userId,
  };
  const userPlatformPostWhere = {
    contentItem: {
      userId,
    },
  };
  const userScheduleWhere = {
    platformPost: {
      contentItem: {
        userId,
      },
    },
  };
  const userReminderWhere = {
    schedule: userScheduleWhere,
  };
  const userPublishAttemptWhere = {
    platformPost: {
      contentItem: {
        userId,
      },
    },
  };

  const [
    contentItemGroupCounts,
    platformPostGroupCounts,
    pendingTodayCount,
    overdueCount,
    upcomingReminderCount,
    doneReminderCount,
    scheduleGroupCounts,
    publishedOrManualDoneThisMonth,
    failedAttemptsThisMonth,
    todayReminders,
    overdueReminders,
    upcomingPosts,
    recentPublishAttempts,
    readyNotScheduledPosts,
    failedPlatformPosts,
    failedSchedules,
    draftPlatformPosts,
  ] = await prisma.$transaction([
    prisma.contentItem.groupBy({
      by: ["status"],
      where: userContentWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.platformPost.groupBy({
      by: ["status"],
      where: userPlatformPostWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.reminder.count({
      where: {
        ...userReminderWhere,
        status: "pending",
        remindAt: {
          gte: todayRange.start,
          lte: todayRange.end,
        },
      },
    }),
    prisma.reminder.count({
      where: {
        ...userReminderWhere,
        status: "pending",
        remindAt: {
          lt: now,
        },
      },
    }),
    prisma.reminder.count({
      where: {
        ...userReminderWhere,
        status: "pending",
        remindAt: {
          gt: now,
        },
      },
    }),
    prisma.reminder.count({
      where: {
        ...userReminderWhere,
        status: "done",
      },
    }),
    prisma.schedule.groupBy({
      by: ["status"],
      where: userScheduleWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.publishAttempt.count({
      where: {
        ...userPublishAttemptWhere,
        attemptedAt: {
          gte: monthRange.start,
          lte: monthRange.end,
        },
        OR: [
          {
            status: "manual_completed",
          },
          {
            status: "success",
          },
        ],
      },
    }),
    prisma.publishAttempt.count({
      where: {
        ...userPublishAttemptWhere,
        status: "failed",
        attemptedAt: {
          gte: monthRange.start,
          lte: monthRange.end,
        },
      },
    }),
    prisma.reminder.findMany({
      where: {
        ...userReminderWhere,
        status: "pending",
        remindAt: {
          gte: todayRange.start,
          lte: todayRange.end,
        },
      },
      orderBy: {
        remindAt: "asc",
      },
      include: reminderInclude(),
    }),
    prisma.reminder.findMany({
      where: {
        ...userReminderWhere,
        status: "pending",
        remindAt: {
          lt: now,
        },
      },
      orderBy: {
        remindAt: "asc",
      },
      include: reminderInclude(),
    }),
    prisma.schedule.findMany({
      where: {
        ...userScheduleWhere,
        status: {
          in: ["scheduled", "manual_pending"],
        },
        scheduledAt: {
          gte: now,
        },
      },
      take: query.upcomingLimit,
      orderBy: {
        scheduledAt: "asc",
      },
      include: scheduleInclude(),
    }),
    prisma.publishAttempt.findMany({
      where: userPublishAttemptWhere,
      take: query.recentLimit,
      orderBy: {
        attemptedAt: "desc",
      },
      include: publishAttemptInclude(),
    }),
    prisma.platformPost.findMany({
      where: {
        ...userPlatformPostWhere,
        status: "ready",
        OR: [
          {
            schedule: null,
          },
          {
            schedule: {
              status: "cancelled",
            },
          },
        ],
      },
      include: platformPostAttentionInclude(),
    }),
    prisma.platformPost.findMany({
      where: {
        ...userPlatformPostWhere,
        status: "failed",
      },
      include: platformPostAttentionInclude(),
    }),
    prisma.schedule.findMany({
      where: {
        ...userScheduleWhere,
        status: "failed",
      },
      include: scheduleInclude(),
    }),
    prisma.platformPost.findMany({
      where: {
        ...userPlatformPostWhere,
        status: "draft",
      },
      include: platformPostAttentionInclude(),
    }),
  ]);

  const scheduleCounts = groupCountsToStatusMap(
    scheduleGroupCounts,
    Object.values(scheduleSummaryStatuses),
    "status"
  );

  return {
    stats: {
      contentItems: groupCountsToStatusMap(
        contentItemGroupCounts,
        contentItemStatuses,
        "status"
      ),
      platformPosts: groupCountsToStatusMap(
        platformPostGroupCounts,
        platformPostStatuses,
        "status"
      ),
      reminders: {
        pendingToday: pendingTodayCount,
        overdue: overdueCount,
        upcoming: upcomingReminderCount,
        done: doneReminderCount,
      },
      schedules: {
        scheduled: scheduleCounts.scheduled,
        manualPending: scheduleCounts.manual_pending,
        manualDone: scheduleCounts.manual_done,
        cancelled: scheduleCounts.cancelled,
        failed: scheduleCounts.failed,
      },
      publishing: {
        publishedOrManualDoneThisMonth,
        failedAttemptsThisMonth,
      },
    },
    todayReminders: todayReminders.map(toReminderSummary),
    overdueReminders: overdueReminders.map(toOverdueReminderSummary),
    upcomingPosts: upcomingPosts.map(toUpcomingPost),
    recentPublishAttempts: recentPublishAttempts.map(toRecentPublishAttempt),
    needsAttention: buildNeedsAttention({
      readyNotScheduledPosts,
      overdueReminders,
      failedPlatformPosts,
      failedSchedules,
      draftPlatformPosts,
    }),
  };
}

function reminderInclude() {
  return {
    schedule: {
      select: {
        id: true,
        platformPost: {
          select: {
            id: true,
            platform: true,
            contentItem: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    },
  };
}

function scheduleInclude() {
  return {
    platformPost: {
      select: {
        id: true,
        platform: true,
        status: true,
        contentItem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    },
  };
}

function publishAttemptInclude() {
  return {
    platformPost: {
      select: {
        platformPostUrl: true,
        contentItem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    },
  };
}

function platformPostAttentionInclude() {
  return {
    contentItem: {
      select: {
        id: true,
        title: true,
      },
    },
    schedule: {
      select: {
        id: true,
        status: true,
      },
    },
  };
}

module.exports = {
  getDashboard,
};
