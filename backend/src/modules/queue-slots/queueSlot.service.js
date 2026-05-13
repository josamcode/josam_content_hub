const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const queueSlotSelect = {
  id: true,
  platform: true,
  dayOfWeek: true,
  timeOfDay: true,
  timezone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function isUniqueConstraintError(error) {
  return error.code === "P2002";
}

function buildListWhere(userId, query) {
  const where = {
    userId,
  };

  if (query.platform) {
    where.platform = query.platform;
  }

  if (query.active !== undefined) {
    where.isActive = query.active;
  }

  return where;
}

async function getOwnedQueueSlot(userId, id) {
  const queueSlot = await prisma.queueSlot.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!queueSlot) {
    throw new ApiError(404, "Queue slot not found");
  }

  return queueSlot;
}

async function assertNoDuplicate(userId, nextQueueSlot, currentId) {
  const where = {
    userId,
    platform: nextQueueSlot.platform,
    dayOfWeek: nextQueueSlot.dayOfWeek,
    timeOfDay: nextQueueSlot.timeOfDay,
  };

  if (currentId) {
    where.id = {
      not: currentId,
    };
  }

  const duplicate = await prisma.queueSlot.findFirst({
    where,
    select: {
      id: true,
    },
  });

  if (duplicate) {
    throw new ApiError(409, "Queue slot already exists");
  }
}

async function listQueueSlots(userId, query) {
  return prisma.queueSlot.findMany({
    where: buildListWhere(userId, query),
    select: queueSlotSelect,
    orderBy: [
      {
        platform: "asc",
      },
      {
        dayOfWeek: "asc",
      },
      {
        timeOfDay: "asc",
      },
    ],
  });
}

async function createQueueSlot(userId, payload) {
  await assertNoDuplicate(userId, payload);

  try {
    return await prisma.queueSlot.create({
      data: {
        ...payload,
        userId,
      },
      select: queueSlotSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, "Queue slot already exists");
    }

    throw error;
  }
}

async function updateQueueSlot(userId, id, payload) {
  const existingQueueSlot = await getOwnedQueueSlot(userId, id);
  const nextQueueSlot = {
    ...existingQueueSlot,
    ...payload,
  };

  await assertNoDuplicate(userId, nextQueueSlot, id);

  try {
    return await prisma.queueSlot.update({
      where: {
        id,
      },
      data: payload,
      select: queueSlotSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(409, "Queue slot already exists");
    }

    throw error;
  }
}

async function deactivateQueueSlot(userId, id) {
  await getOwnedQueueSlot(userId, id);

  await prisma.queueSlot.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}

module.exports = {
  listQueueSlots,
  createQueueSlot,
  updateQueueSlot,
  deactivateQueueSlot,
};
