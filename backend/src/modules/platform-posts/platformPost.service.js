const prisma = require("../../config/prisma");
const platformRules = require("../../rules/platformRules");
const ApiError = require("../../utils/apiError");

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

const platformPostSummarySelect = {
  id: true,
  platform: true,
  status: true,
};

const deletableStatuses = ["draft", "ready"];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildValidationResult(platformPost) {
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

function formatPlatformName(platform) {
  const names = {
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
  };

  return names[platform] || platform;
}

function mergeDefinedFields(existingPlatformPost, payload) {
  return Object.keys(payload).reduce(
    (merged, key) => {
      if (payload[key] !== undefined) {
        merged[key] = payload[key];
      }

      return merged;
    },
    { ...existingPlatformPost }
  );
}

async function assertOwnedContentItem(userId, contentItemId) {
  const contentItem = await prisma.contentItem.findFirst({
    where: {
      id: contentItemId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!contentItem) {
    throw new ApiError(404, "Content item not found");
  }

  return contentItem;
}

async function getOwnedPlatformPost(userId, id) {
  const platformPost = await prisma.platformPost.findFirst({
    where: {
      id,
      contentItem: {
        userId,
      },
    },
  });

  if (!platformPost) {
    throw new ApiError(404, "Platform post not found");
  }

  return platformPost;
}

async function listPlatformPosts(userId, contentItemId) {
  await assertOwnedContentItem(userId, contentItemId);

  return prisma.platformPost.findMany({
    where: {
      contentItemId,
    },
    select: platformPostDetailsSelect,
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function createPlatformPost(userId, contentItemId, payload) {
  await assertOwnedContentItem(userId, contentItemId);

  const existingPlatformPost = await prisma.platformPost.findFirst({
    where: {
      contentItemId,
      platform: payload.platform,
    },
    select: {
      id: true,
    },
  });

  if (existingPlatformPost) {
    throw new ApiError(409, "Platform post already exists for this content item");
  }

  try {
    return await prisma.platformPost.create({
      data: {
        contentItemId,
        platform: payload.platform,
      },
      select: platformPostSummarySelect,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new ApiError(
        409,
        "Platform post already exists for this content item"
      );
    }

    throw error;
  }
}

async function updatePlatformPost(userId, id, payload) {
  const existingPlatformPost = await getOwnedPlatformPost(userId, id);
  const nextPlatformPost = mergeDefinedFields(existingPlatformPost, payload);

  if (payload.status === "ready") {
    const validationResult = buildValidationResult(nextPlatformPost);

    if (!validationResult.valid) {
      throw new ApiError(
        422,
        "Platform post validation failed",
        validationResult
      );
    }
  }

  return prisma.platformPost.update({
    where: {
      id,
    },
    data: payload,
    select: platformPostDetailsSelect,
  });
}

async function deletePlatformPost(userId, id) {
  const platformPost = await getOwnedPlatformPost(userId, id);

  if (!deletableStatuses.includes(platformPost.status)) {
    throw new ApiError(
      409,
      "Only draft or ready platform posts can be deleted"
    );
  }

  await prisma.platformPost.delete({
    where: {
      id,
    },
  });
}

async function validatePlatformPost(userId, id) {
  const platformPost = await getOwnedPlatformPost(userId, id);

  return buildValidationResult(platformPost);
}

module.exports = {
  listPlatformPosts,
  createPlatformPost,
  updatePlatformPost,
  deletePlatformPost,
  validatePlatformPost,
};
