function buildSystemPrompt(profile) {
  const sections = [];

  sections.push(
    "You are a social media metadata generator for a content creator."
  );
  sections.push(
    "Your task is to generate platform-specific metadata based on an idea and brand profile."
  );

  // Brand identity
  const identity = [];
  if (profile.audience) identity.push(`Audience: ${profile.audience}`);
  if (profile.tone) identity.push(`Tone: ${profile.tone}`);
  if (profile.language) identity.push(`Language: ${profile.language}`);
  if (profile.contentGoal) identity.push(`Content Goal: ${profile.contentGoal}`);
  if (profile.ctaStyle) identity.push(`CTA Style: ${profile.ctaStyle}`);
  if (identity.length > 0) {
    sections.push("Brand Profile:\n" + identity.join("\n"));
  }

  if (profile.forbiddenWords?.length > 0) {
    sections.push(
      `Forbidden Words (NEVER use these): ${profile.forbiddenWords.join(", ")}`
    );
  }

  if (profile.hashtagBank?.length > 0) {
    sections.push(
      `Hashtag Bank (use relevant ones and add complementary ones): ${profile.hashtagBank.join(", ")}`
    );
  }

  if (profile.servicesToPromote?.length > 0) {
    sections.push(
      `Services/Courses (promote naturally when relevant): ${profile.servicesToPromote.join(", ")}`
    );
  }

  if (profile.platformInstructions) {
    const pi = profile.platformInstructions;
    const instructions = [];
    if (pi.youtube) instructions.push(`YouTube: ${pi.youtube}`);
    if (pi.instagram) instructions.push(`Instagram: ${pi.instagram}`);
    if (pi.facebook) instructions.push(`Facebook: ${pi.facebook}`);
    if (pi.tiktok) instructions.push(`TikTok: ${pi.tiktok}`);
    if (instructions.length > 0) {
      sections.push("Platform-specific instructions:\n" + instructions.join("\n"));
    }
  }

  sections.push(`Response format (include only requested platforms):
{
  "youtube": {
    "title": "...",
    "description": "...",
    "tags": ["..."]
    "hashtags": ["..."]
  },
  "instagram": {
    "caption": "...",
    "hashtags": ["..."]
  },
  "facebook": {
    "caption": "...",
    "hashtags": ["..."]
  },
  "tiktok": {
    "caption": "...",
    "hashtags": ["..."]
  }
}`);

  sections.push(`Rules:
1. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.
2. Use the brand's voice, tone, and language.
3. Avoid ALL forbidden words.
4. Use hashtags from the brand's hashtag bank where relevant; add complementary ones. No duplicates.
5. Content must be useful and sales-aware, not spammy or generic hype.
6. YouTube title: clear and clickable, not clickbait.
7. YouTube description: practical context with a soft CTA.
8. Instagram caption: concise, engaging, lead with the key point.
9. TikTok caption: short, strong hook, one clear idea.
10. Facebook caption: slightly longer, discussion-friendly, builds trust.
11. When writing in Arabic, use natural Egyptian dialect when the tone matches. No machine-translation feel.
12. Soft CTA only where it fits naturally — never forced.`);

  return sections.join("\n\n");
}

function buildUserPrompt(idea, category, language, targetPlatforms) {
  return [
    "Generate platform-specific metadata for this idea:",
    "",
    `Idea: "${idea}"`,
    category ? `Category: ${category}` : "",
    language ? `Language: ${language}` : "",
    "",
    `Target platforms: ${targetPlatforms.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

module.exports = {
  buildSystemPrompt,
  buildUserPrompt,
};
