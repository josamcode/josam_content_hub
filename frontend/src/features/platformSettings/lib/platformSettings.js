export const PLATFORM_ORDER = ["youtube", "instagram", "tiktok", "facebook"];

export const PLATFORM_STRATEGY = {
  youtube: {
    name: "YouTube",
    summary: "Long-form home for in-depth pieces.",
    currentStatus: "Manual now, auto later",
    statusTone: "warning",
    futurePlan:
      "Add official YouTube Data API v3 with OAuth and a token refresh loop.",
  },
  instagram: {
    name: "Instagram",
    summary: "Short vertical clips and visual content.",
    currentStatus: "Manual / reminder",
    statusTone: "warning",
    futurePlan:
      "Onboard a Meta app, link an Instagram Professional account, request graph permissions.",
  },
  tiktok: {
    name: "TikTok",
    summary: "Vertical short-form, manual-first by design.",
    currentStatus: "Manual only",
    statusTone: "neutral",
    futurePlan:
      "Revisit TikTok Content Posting API once approval is realistic; otherwise stay manual.",
  },
  facebook: {
    name: "Facebook",
    summary: "Page-first posting through Meta.",
    currentStatus: "Manual / reminder",
    statusTone: "warning",
    futurePlan:
      "Reuse the Meta app from Instagram and target a specific Facebook Page.",
  },
};

export const PUBLISH_MODE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "reminder", label: "Reminder" },
  { value: "auto", label: "Auto (not active)" },
];

export const INTEGRATION_ROADMAP = [
  {
    title: "YouTube official integration",
    description: "OAuth + YouTube Data API v3 for auto-publishing.",
    status: "Up next",
    tone: "accent",
  },
  {
    title: "Meta integration for Facebook & Instagram",
    description:
      "Single Meta app handles both Pages and Instagram Professional accounts.",
    status: "Planned",
    tone: "neutral",
  },
  {
    title: "TikTok official API research",
    description:
      "Validate TikTok approval flow before committing to an integration.",
    status: "Research",
    tone: "warning",
  },
  {
    title: "Analytics across platforms",
    description:
      "Pull post-level performance once each integration lands.",
    status: "Later",
    tone: "neutral",
  },
];
