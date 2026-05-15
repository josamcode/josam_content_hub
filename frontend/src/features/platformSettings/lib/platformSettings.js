export const PLATFORM_ORDER = ["youtube", "instagram", "tiktok", "facebook"];

export const PLATFORM_STRATEGY = {
  youtube: {
    name: "YouTube",
    summaryKey: "youtube.summary",
    statusKey: "youtube.status",
    statusTone: "warning",
    futurePlanKey: "youtube.futurePlan",
  },
  instagram: {
    name: "Instagram",
    summaryKey: "instagram.summary",
    statusKey: "instagram.status",
    statusTone: "warning",
    futurePlanKey: "instagram.futurePlan",
  },
  tiktok: {
    name: "TikTok",
    summaryKey: "tiktok.summary",
    statusKey: "tiktok.status",
    statusTone: "neutral",
    futurePlanKey: "tiktok.futurePlan",
  },
  facebook: {
    name: "Facebook",
    summaryKey: "facebook.summary",
    statusKey: "facebook.status",
    statusTone: "warning",
    futurePlanKey: "facebook.futurePlan",
  },
};

export const PUBLISH_MODE_OPTIONS = [
  { value: "manual" },
  { value: "reminder" },
  { value: "auto" },
];

export const INTEGRATION_ROADMAP = [
  {
    key: "youtube",
    tone: "accent",
  },
  {
    key: "meta",
    tone: "neutral",
  },
  {
    key: "tiktok",
    tone: "warning",
  },
  {
    key: "analytics",
    tone: "neutral",
  },
];
