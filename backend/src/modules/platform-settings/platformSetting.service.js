const prisma = require("../../config/prisma");

const PLATFORM_ORDER = ["youtube", "instagram", "tiktok", "facebook"];

const PLATFORM_DEFAULTS = {
  youtube: {
    isEnabled: true,
    defaultPublishMode: "manual",
    defaultHashtags: [],
    defaultTags: ["software engineering", "web development"],
    captionTemplate: null,
    titleTemplate: null,
    descriptionTemplate: null,
    notes: "YouTube auto publishing is planned later.",
  },
  instagram: {
    isEnabled: true,
    defaultPublishMode: "manual",
    defaultHashtags: ["#programming", "#webdevelopment", "#softwareengineering"],
    defaultTags: [],
    captionTemplate: null,
    titleTemplate: null,
    descriptionTemplate: null,
    notes: "Manual/reminder workflow until Meta integration.",
  },
  tiktok: {
    isEnabled: true,
    defaultPublishMode: "manual",
    defaultHashtags: ["#programming", "#webdevelopment"],
    defaultTags: [],
    captionTemplate: null,
    titleTemplate: null,
    descriptionTemplate: null,
    notes: "TikTok stays manual-first.",
  },
  facebook: {
    isEnabled: true,
    defaultPublishMode: "manual",
    defaultHashtags: ["#businesssystems", "#webdevelopment"],
    defaultTags: [],
    captionTemplate: null,
    titleTemplate: null,
    descriptionTemplate: null,
    notes: "Facebook publishing later through Meta APIs.",
  },
};

const platformSettingSelect = {
  id: true,
  platform: true,
  isEnabled: true,
  defaultPublishMode: true,
  defaultHashtags: true,
  defaultTags: true,
  captionTemplate: true,
  titleTemplate: true,
  descriptionTemplate: true,
  notes: true,
};

function sortByPlatformOrder(settings) {
  const index = new Map(PLATFORM_ORDER.map((platform, i) => [platform, i]));
  return [...settings].sort(
    (a, b) => index.get(a.platform) - index.get(b.platform)
  );
}

async function ensurePlatformSetting(userId, platform) {
  const defaults = PLATFORM_DEFAULTS[platform];

  return prisma.platformSetting.upsert({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
    update: {},
    create: {
      userId,
      platform,
      ...defaults,
    },
    select: platformSettingSelect,
  });
}

async function listPlatformSettings(userId) {
  const existing = await prisma.platformSetting.findMany({
    where: { userId },
    select: platformSettingSelect,
  });

  const existingByPlatform = new Map(existing.map((s) => [s.platform, s]));
  const missing = PLATFORM_ORDER.filter((p) => !existingByPlatform.has(p));

  if (missing.length > 0) {
    await Promise.all(missing.map((p) => ensurePlatformSetting(userId, p)));

    const refreshed = await prisma.platformSetting.findMany({
      where: { userId },
      select: platformSettingSelect,
    });

    return sortByPlatformOrder(refreshed);
  }

  return sortByPlatformOrder(existing);
}

async function getPlatformSetting(userId, platform) {
  return ensurePlatformSetting(userId, platform);
}

async function updatePlatformSetting(userId, platform, payload) {
  const defaults = PLATFORM_DEFAULTS[platform];

  return prisma.platformSetting.upsert({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
    update: payload,
    create: {
      userId,
      platform,
      ...defaults,
      ...payload,
    },
    select: platformSettingSelect,
  });
}

module.exports = {
  PLATFORM_ORDER,
  PLATFORM_DEFAULTS,
  listPlatformSettings,
  getPlatformSetting,
  updatePlatformSetting,
};
