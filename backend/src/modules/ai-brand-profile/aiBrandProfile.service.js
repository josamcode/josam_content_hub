const prisma = require("../../config/prisma");

const DEFAULT_PROFILE = {
  audience:
    "Beginner and intermediate Arab developers who want practical software engineering and business-focused web development advice.",
  tone:
    "Egyptian Arabic, direct, practical, clear, confident, not overhyped.",
  language: "Arabic",
  contentGoal:
    "Build trust, teach practical programming/software engineering, and support selling web development services and future courses.",
  ctaStyle:
    "Soft and useful CTA. Avoid pushy selling. Use direct CTA only when the content naturally supports it.",
  forbiddenWords: [
    "game changer",
    "revolutionary",
    "unbelievable",
    "mind-blowing",
    "secret hack",
    "make millions",
    "get rich quick",
    "guaranteed success",
    "100%",
    "never fail",
  ],
  hashtagBank: [
    "برمجة",
    "تطوير_الويب",
    "softwareengineering",
    "webdevelopment",
    "programming",
    "josamcode",
    "fullstack",
    "javascript",
    "reactjs",
    "nodejs",
    "تعلم_البرمجة",
    "coding",
    "backend",
    "frontend",
    "database",
  ],
  servicesToPromote: [
    "web development",
    "business systems",
    "ARA Financial",
    "software engineering courses",
  ],
  courseTopics: [
    "programming basics",
    "full-stack development",
    "software engineering",
    "project building",
    "client acquisition",
  ],
  platformInstructions: {
    youtube: "Title, description, and tags should be clear and searchable. Optimize for YouTube SEO. Use Arabic-friendly keywords.",
    instagram: "Caption should be concise and engaging. Highlight the key takeaway in the first line.",
    tiktok: "Caption should be short and hook-driven. Use trending sounds context in the description.",
    facebook: "Caption can be slightly more explanatory. Good for longer-form community discussion.",
  },
};

const profileSelect = {
  id: true,
  audience: true,
  tone: true,
  language: true,
  contentGoal: true,
  ctaStyle: true,
  forbiddenWords: true,
  hashtagBank: true,
  servicesToPromote: true,
  courseTopics: true,
  platformInstructions: true,
  createdAt: true,
  updatedAt: true,
};

async function getOrCreateProfile(userId) {
  const existing = await prisma.aiBrandProfile.findUnique({
    where: { userId },
    select: profileSelect,
  });

  if (existing) return existing;

  return prisma.aiBrandProfile.create({
    data: {
      userId,
      ...DEFAULT_PROFILE,
    },
    select: profileSelect,
  });
}

async function updateProfile(userId, payload) {
  const existing = await prisma.aiBrandProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    return prisma.aiBrandProfile.create({
      data: {
        userId,
        ...DEFAULT_PROFILE,
        ...payload,
      },
      select: profileSelect,
    });
  }

  return prisma.aiBrandProfile.update({
    where: { userId },
    data: payload,
    select: profileSelect,
  });
}

module.exports = {
  DEFAULT_PROFILE,
  getOrCreateProfile,
  updateProfile,
};
