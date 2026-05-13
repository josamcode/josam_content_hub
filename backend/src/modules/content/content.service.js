const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const platformPostSummarySelect = {
  id: true,
  platform: true,
  status: true,
};

const platformPostDetailsSelect = {
  id: true,
  platform: true,
  title: true,
  caption: true,
  description: true,
  hashtags: true,
  tags: true,
  status: true,
  platformPostUrl: true,
  createdAt: true,
  updatedAt: true,
};

function buildListWhere(userId, query) {
  const where = {
    userId,
  };

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = {
      not: "archived",
    };
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.platform) {
    where.platformPosts = {
      some: {
        platform: query.platform,
      },
    };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { hook: { contains: query.search, mode: "insensitive" } },
      { notes: { contains: query.search, mode: "insensitive" } },
      { script: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function toListItem(contentItem) {
  return {
    id: contentItem.id,
    title: contentItem.title,
    category: contentItem.category,
    status: contentItem.status,
    hook: contentItem.hook,
    platforms: contentItem.platformPosts.map((post) => post.platform),
    platformPosts: contentItem.platformPosts,
    createdAt: contentItem.createdAt,
  };
}

async function createContentItem(userId, payload) {
  const { targetPlatforms, ...contentItemData } = payload;
  const platforms = targetPlatforms || [];
  const data = {
    ...contentItemData,
    userId,
  };

  if (platforms.length > 0) {
    data.platformPosts = {
      create: platforms.map((platform) => ({ platform })),
    };
  }

  return prisma.$transaction(async (tx) => {
    const contentItem = await tx.contentItem.create({
      data,
      include: {
        platformPosts: {
          select: platformPostSummarySelect,
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return {
      id: contentItem.id,
      title: contentItem.title,
      category: contentItem.category,
      status: contentItem.status,
      platformPosts: contentItem.platformPosts,
    };
  });
}

async function listContentItems(userId, query) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const where = buildListWhere(userId, query);

  const [total, contentItems] = await prisma.$transaction([
    prisma.contentItem.count({ where }),
    prisma.contentItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        platformPosts: {
          select: platformPostSummarySelect,
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
  ]);

  return {
    data: contentItems.map(toListItem),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getContentItemById(userId, id) {
  const contentItem = await prisma.contentItem.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      platformPosts: {
        select: platformPostDetailsSelect,
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!contentItem) {
    throw new ApiError(404, "Content item not found");
  }

  return contentItem;
}

async function updateContentItem(userId, id, payload) {
  const existingContentItem = await prisma.contentItem.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingContentItem) {
    throw new ApiError(404, "Content item not found");
  }

  return prisma.contentItem.update({
    where: {
      id,
    },
    data: payload,
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      hook: true,
      script: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function archiveContentItem(userId, id) {
  const existingContentItem = await prisma.contentItem.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingContentItem) {
    throw new ApiError(404, "Content item not found");
  }

  await prisma.contentItem.update({
    where: {
      id,
    },
    data: {
      status: "archived",
    },
  });
}

module.exports = {
  createContentItem,
  listContentItems,
  getContentItemById,
  updateContentItem,
  archiveContentItem,
};
