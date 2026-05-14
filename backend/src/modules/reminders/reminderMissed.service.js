const prisma = require("../../config/prisma");

const activeScheduleStatuses = {
  notIn: ["cancelled", "manual_done", "published"],
};

async function markOverdueRemindersMissed(now = new Date()) {
  const result = await prisma.reminder.updateMany({
    where: {
      status: "pending",
      remindAt: {
        lt: now,
      },
      schedule: {
        status: activeScheduleStatuses,
      },
    },
    data: {
      status: "missed",
    },
  });

  return {
    count: result.count,
    processedAt: now,
  };
}

module.exports = {
  markOverdueRemindersMissed,
};
