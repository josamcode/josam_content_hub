const prisma = require("../../config/prisma");

const CONTENT_CATEGORY_ORDER = [
  "programming",
  "software_engineering",
  "business_systems",
  "ara_financial",
  "portfolio_client_acquisition",
  "course_content",
  "saas_product_journey",
  "personal_brand",
];

const CATEGORY_DEFAULTS = {
  programming: {
    defaultGoal: "teach a practical programming concept",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "youtube"],
    notes: null,
    isActive: true,
  },
  software_engineering: {
    defaultGoal: "explain real production engineering thinking",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "youtube"],
    notes: null,
    isActive: true,
  },
  business_systems: {
    defaultGoal: "show how software solves business operations problems",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "facebook", "youtube"],
    notes: null,
    isActive: true,
  },
  ara_financial: {
    defaultGoal: "demonstrate ARA Financial as a real business/ERP system",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "facebook", "youtube"],
    notes: null,
    isActive: true,
  },
  portfolio_client_acquisition: {
    defaultGoal: "attract clients for web development/business systems",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "facebook"],
    notes: null,
    isActive: true,
  },
  course_content: {
    defaultGoal: "teach fundamentals clearly and build trust for courses",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "youtube"],
    notes: null,
    isActive: true,
  },
  saas_product_journey: {
    defaultGoal: "document product building and SaaS lessons",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "youtube"],
    notes: null,
    isActive: true,
  },
  personal_brand: {
    defaultGoal: "build JoSam Code authority and trust",
    defaultHookStyle: null,
    defaultCaptionStyle: null,
    defaultHashtags: [],
    defaultPlatforms: ["tiktok", "instagram", "facebook"],
    notes: null,
    isActive: true,
  },
};

const categoryDefaultSelect = {
  id: true,
  category: true,
  defaultGoal: true,
  defaultHookStyle: true,
  defaultCaptionStyle: true,
  defaultHashtags: true,
  defaultPlatforms: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

function sortByCategoryOrder(defaults) {
  const index = new Map(
    CONTENT_CATEGORY_ORDER.map((category, order) => [category, order])
  );

  return [...defaults].sort(
    (a, b) => index.get(a.category) - index.get(b.category)
  );
}

async function ensureCategoryDefault(userId, category) {
  const defaults = CATEGORY_DEFAULTS[category];

  return prisma.contentCategoryDefault.upsert({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
    update: {},
    create: {
      userId,
      category,
      ...defaults,
    },
    select: categoryDefaultSelect,
  });
}

async function listCategoryDefaults(userId) {
  const existing = await prisma.contentCategoryDefault.findMany({
    where: { userId },
    select: categoryDefaultSelect,
  });

  const existingByCategory = new Map(
    existing.map((categoryDefault) => [
      categoryDefault.category,
      categoryDefault,
    ])
  );
  const missing = CONTENT_CATEGORY_ORDER.filter(
    (category) => !existingByCategory.has(category)
  );

  if (missing.length > 0) {
    await Promise.all(
      missing.map((category) => ensureCategoryDefault(userId, category))
    );

    const refreshed = await prisma.contentCategoryDefault.findMany({
      where: { userId },
      select: categoryDefaultSelect,
    });

    return sortByCategoryOrder(refreshed);
  }

  return sortByCategoryOrder(existing);
}

async function getCategoryDefault(userId, category) {
  return ensureCategoryDefault(userId, category);
}

async function updateCategoryDefault(userId, category, payload) {
  const defaults = CATEGORY_DEFAULTS[category];

  return prisma.contentCategoryDefault.upsert({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
    update: payload,
    create: {
      userId,
      category,
      ...defaults,
      ...payload,
    },
    select: categoryDefaultSelect,
  });
}

module.exports = {
  CONTENT_CATEGORY_ORDER,
  CATEGORY_DEFAULTS,
  listCategoryDefaults,
  getCategoryDefault,
  updateCategoryDefault,
};
