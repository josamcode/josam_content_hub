const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

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

function getCairoDayRange(now = new Date()) {
  const timeZone = "Africa/Cairo";
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

function buildReminderWhere(userId, query) {
  const where = {
    schedule: {
      platformPost: {
        contentItem: {
          userId,
        },
      },
    },
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.platform) {
    where.schedule.platformPost.platform = query.platform;
  }

  if (query.range === "done") {
    where.status = "done";
  }

  if (query.range === "upcoming") {
    where.status = "pending";
    where.remindAt = {
      gt: new Date(),
    };
  }

  if (query.range === "overdue") {
    where.status = {
      in: ["pending", "missed"],
    };
    where.remindAt = {
      lt: new Date(),
    };
  }

  if (query.range === "today") {
    const { start, end } = getCairoDayRange();
    where.remindAt = {
      gte: start,
      lte: end,
    };
  }

  return where;
}

function toReminderListItem(reminder) {
  const platformPost = reminder.schedule.platformPost;
  const contentItem = platformPost.contentItem;

  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    remindAt: reminder.remindAt,
    status: reminder.status,
    schedule: {
      id: reminder.schedule.id,
      status: reminder.schedule.status,
      publishMode: reminder.schedule.publishMode,
      scheduledAt: reminder.schedule.scheduledAt,
    },
    platformPost: {
      id: platformPost.id,
      platform: platformPost.platform,
      caption: platformPost.caption,
      hashtags: platformPost.hashtags,
      status: platformPost.status,
    },
    contentItem: {
      id: contentItem.id,
      title: contentItem.title,
      status: contentItem.status,
    },
  };
}

function toReminderDetails(reminder) {
  const platformPost = reminder.schedule.platformPost;
  const contentItem = platformPost.contentItem;

  return {
    id: reminder.id,
    title: reminder.title,
    message: reminder.message,
    remindAt: reminder.remindAt,
    status: reminder.status,
    platform: platformPost.platform,
    caption: platformPost.caption,
    hashtags: platformPost.hashtags,
    contentTitle: contentItem.title,
    contentItemId: contentItem.id,
    platformPostId: platformPost.id,
    scheduleId: reminder.schedule.id,
  };
}

async function listReminders(userId, query) {
  const reminders = await prisma.reminder.findMany({
    where: buildReminderWhere(userId, query),
    orderBy: {
      remindAt: "asc",
    },
    include: {
      schedule: {
        select: {
          id: true,
          status: true,
          publishMode: true,
          scheduledAt: true,
          platformPost: {
            select: {
              id: true,
              platform: true,
              caption: true,
              hashtags: true,
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
      },
    },
  });

  return reminders.map(toReminderListItem);
}

async function getReminderById(userId, id) {
  const reminder = await prisma.reminder.findFirst({
    where: {
      id,
      schedule: {
        platformPost: {
          contentItem: {
            userId,
          },
        },
      },
    },
    include: {
      schedule: {
        select: {
          id: true,
          platformPost: {
            select: {
              id: true,
              platform: true,
              caption: true,
              hashtags: true,
              contentItem: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!reminder) {
    throw new ApiError(404, "Reminder not found");
  }

  return toReminderDetails(reminder);
}

async function updateReminder(userId, id, payload) {
  const reminder = await prisma.reminder.findFirst({
    where: {
      id,
      schedule: {
        platformPost: {
          contentItem: {
            userId,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!reminder) {
    throw new ApiError(404, "Reminder not found");
  }

  return prisma.reminder.update({
    where: {
      id,
    },
    data: {
      status: payload.status,
      completedAt: payload.status === "done" ? new Date() : null,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
    },
  });
}

module.exports = {
  listReminders,
  getReminderById,
  updateReminder,
};
