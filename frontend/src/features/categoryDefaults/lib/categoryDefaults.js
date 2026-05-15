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

export const CATEGORY_TRANSLATION_KEYS = {
  programming: "programming",
  software_engineering: "softwareEngineering",
  business_systems: "businessSystems",
  ara_financial: "araFinancial",
  portfolio_client_acquisition: "portfolioClientAcquisition",
  course_content: "courseContent",
  saas_product_journey: "saasProductJourney",
  personal_brand: "personalBrand",
};

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

export const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
];

export function categoryLabel(category, t) {
  const key = CATEGORY_TRANSLATION_KEYS[category];
  if (key && typeof t === "function") {
    return t(`categoryDefaults.categories.${key}.label`, { ns: "pages" });
  }
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
