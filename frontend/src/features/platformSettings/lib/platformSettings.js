export const PLATFORM_SETTINGS = [
  {
    platform: "youtube",
    name: "YouTube",
    summary: "Long-form home for in-depth pieces.",
    currentStatus: "Manual now, auto later",
    statusTone: "warning",
    defaultPublishMode: "manual",
    autoPublish: { label: "Planned", tone: "warning" },
    manualWorkflow: { label: "Enabled", tone: "success" },
    requiredFields: ["title"],
    optionalFields: ["description", "tags", "thumbnail"],
    notes:
      "YouTube will likely be the first real auto-publishing integration.",
    futurePlan:
      "Add official YouTube Data API v3 with OAuth and a token refresh loop.",
  },
  {
    platform: "instagram",
    name: "Instagram",
    summary: "Short vertical clips and visual content.",
    currentStatus: "Manual / reminder",
    statusTone: "warning",
    defaultPublishMode: "manual",
    autoPublish: { label: "Later · via Meta API", tone: "neutral" },
    manualWorkflow: { label: "Enabled", tone: "success" },
    requiredFields: ["caption"],
    optionalFields: ["hashtags"],
    notes:
      "Requires Instagram Professional account and Meta app permissions later.",
    futurePlan:
      "Onboard a Meta app, link an Instagram Professional account, request graph permissions.",
  },
  {
    platform: "tiktok",
    name: "TikTok",
    summary: "Vertical short-form, manual-first by design.",
    currentStatus: "Manual only",
    statusTone: "neutral",
    defaultPublishMode: "manual",
    autoPublish: { label: "Disabled for MVP", tone: "danger" },
    manualWorkflow: { label: "Enabled", tone: "success" },
    requiredFields: ["caption"],
    optionalFields: ["hashtags"],
    notes:
      "TikTok API is risky and approval-heavy, so keep manual-first.",
    futurePlan:
      "Revisit TikTok Content Posting API once approval is realistic; otherwise stay manual.",
  },
  {
    platform: "facebook",
    name: "Facebook",
    summary: "Page-first posting through Meta.",
    currentStatus: "Manual / reminder",
    statusTone: "warning",
    defaultPublishMode: "manual",
    autoPublish: { label: "Later · via Meta API", tone: "neutral" },
    manualWorkflow: { label: "Enabled", tone: "success" },
    requiredFields: ["caption"],
    optionalFields: ["hashtags"],
    notes:
      "Facebook Page publishing can be added later through official Meta APIs.",
    futurePlan:
      "Reuse the Meta app from Instagram and target a specific Facebook Page.",
  },
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
