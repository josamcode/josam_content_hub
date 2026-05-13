const platformRules = {
  youtube: {
    requiresTitle: true,
    requiresCaption: false,
    supportsDescription: true,
    supportsTags: true,
    supportsThumbnail: true,
    preferredAspectRatio: "9:16",
    defaultPublishMode: "manual",
  },
  instagram: {
    requiresCaption: true,
    maxCaptionLength: 2200,
    preferredAspectRatio: "9:16",
    defaultPublishMode: "manual",
  },
  tiktok: {
    requiresCaption: true,
    preferredAspectRatio: "9:16",
    defaultPublishMode: "manual",
    autoPublishRisk: "high",
  },
  facebook: {
    requiresCaption: true,
    preferredAspectRatio: "9:16",
    defaultPublishMode: "manual",
  },
};

module.exports = platformRules;
