const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  severity: true,
  entityType: true,
  entityId: true,
  payload: true,
  isRead: true,
  emailStatus: true,
  sentAt: true,
  createdAt: true,
};

function buildNotificationWhere(userId, filters) {
  const where = { userId };

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (typeof filters.isRead === "boolean") {
    where.isRead = filters.isRead;
  }

  return where;
}

function getSafeRecordErrorMessage(error) {
  if (!error) return "unknown";
  if (typeof error.message === "string") return error.message.slice(0, 300);
  return "unknown";
}

async function createNotificationEvent(data) {
  return prisma.notificationEvent.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message || null,
      severity: data.severity || "info",
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      payload: data.payload || undefined,
      emailStatus: data.emailStatus || null,
      sentAt: data.sentAt || null,
    },
    select: notificationSelect,
  });
}

async function recordNotificationEvent(data) {
  try {
    return await createNotificationEvent(data);
  } catch (error) {
    console.error(
      `NotificationEvent recording failed: ${getSafeRecordErrorMessage(error)}`
    );
    return null;
  }
}

async function listNotificationEvents(userId, filters) {
  const page = filters.page;
  const limit = filters.limit;
  const skip = (page - 1) * limit;
  const where = buildNotificationWhere(userId, filters);

  const [total, events] = await prisma.$transaction([
    prisma.notificationEvent.count({ where }),
    prisma.notificationEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: notificationSelect,
    }),
  ]);

  return {
    data: events,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getNotificationEvent(userId, id) {
  const event = await prisma.notificationEvent.findFirst({
    where: {
      id,
      userId,
    },
    select: notificationSelect,
  });

  if (!event) {
    throw new ApiError(404, "Notification event not found");
  }

  return event;
}

async function markNotificationRead(userId, id) {
  await getNotificationEvent(userId, id);

  return prisma.notificationEvent.update({
    where: {
      id,
    },
    data: {
      isRead: true,
    },
    select: notificationSelect,
  });
}

async function markEmailSent(eventId) {
  return prisma.notificationEvent.update({
    where: {
      id: eventId,
    },
    data: {
      emailStatus: "sent",
      sentAt: new Date(),
    },
    select: notificationSelect,
  });
}

async function updateEmailStatusWithSafeReason(eventId, status, reason) {
  const event = await prisma.notificationEvent.findUnique({
    where: {
      id: eventId,
    },
    select: {
      payload: true,
    },
  });

  const currentPayload =
    event && event.payload && typeof event.payload === "object"
      ? event.payload
      : {};

  return prisma.notificationEvent.update({
    where: {
      id: eventId,
    },
    data: {
      emailStatus: status,
      payload: {
        ...currentPayload,
        emailStatusReason: reason ? String(reason).slice(0, 300) : null,
      },
    },
    select: notificationSelect,
  });
}

async function markEmailFailed(eventId, reason) {
  return updateEmailStatusWithSafeReason(eventId, "failed", reason);
}

async function markEmailSkipped(eventId, reason) {
  return updateEmailStatusWithSafeReason(eventId, "skipped", reason);
}

module.exports = {
  createNotificationEvent,
  recordNotificationEvent,
  listNotificationEvents,
  getNotificationEvent,
  markNotificationRead,
  markEmailSent,
  markEmailFailed,
  markEmailSkipped,
};
