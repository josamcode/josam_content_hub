export const CATEGORY_ORDER = [
  "programming",
  "software_engineering",
  "business_systems",
  "ara_financial",
  "portfolio_client_acquisition",
  "course_content",
  "saas_product_journey",
  "personal_brand",
];

export const CATEGORY_LABELS = {
  programming: "Programming",
  software_engineering: "Software Engineering",
  business_systems: "Business Systems",
  ara_financial: "ARA Financial",
  portfolio_client_acquisition: "Client Acquisition",
  course_content: "Course Content",
  saas_product_journey: "SaaS Product Journey",
  personal_brand: "Personal Brand",
};

export const CATEGORY_DESCRIPTIONS = {
  programming: "Teach practical programming concepts.",
  software_engineering: "Real production engineering thinking.",
  business_systems: "How software solves operations problems.",
  ara_financial: "ARA Financial as a real ERP/business system.",
  portfolio_client_acquisition:
    "Attract clients for web dev & business systems.",
  course_content: "Build trust and teach fundamentals for courses.",
  saas_product_journey: "Document SaaS building lessons.",
  personal_brand: "JoSam Code authority and trust.",
};

export const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
];

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function hashtagsArrayToText(hashtags) {
  if (!Array.isArray(hashtags)) return "";
  return hashtags.join(", ");
}

export function parseHashtagsText(text) {
  if (typeof text !== "string") return [];
  return text
    .split(/[\n,]+/)
    .map((entry) => entry.trim().replace(/^#+/, "").trim())
    .filter((entry) => entry.length > 0);
}

export function sortCategoryDefaults(list) {
  const index = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  return [...list].sort((a, b) => {
    const aIdx = index.has(a.category) ? index.get(a.category) : 99;
    const bIdx = index.has(b.category) ? index.get(b.category) : 99;
    return aIdx - bIdx;
  });
}
