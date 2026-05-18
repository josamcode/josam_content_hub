const env = require("../../config/env");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const aiBrandProfileService = require("../ai-brand-profile/aiBrandProfile.service");
const { buildSystemPrompt, buildUserPrompt } = require("./aiMetadata.prompt");
const { aiOutputSchema } = require("./aiMetadata.validation");

const PROVIDER_DEFAULTS = {
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
};

function getProviderConfig() {
  const provider = env.aiProvider || "deepseek";
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.deepseek;
  return {
    provider,
    baseUrl: env.aiBaseUrl || defaults.baseUrl,
    model: env.aiModel || defaults.model,
    apiKey: env.aiApiKey,
  };
}

async function callAiProvider(messages) {
  const config = getProviderConfig();

  if (!config.apiKey) {
    throw new ApiError(502, "AI provider API key is not configured.");
  }

  const url = `${config.baseUrl}/chat/completions`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch {
    throw new ApiError(
      502,
      "AI provider request failed. Please try again later."
    );
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 401 || status === 403) {
      throw new ApiError(
        502,
        "AI provider authentication failed. Check your API key."
      );
    }
    if (status === 429) {
      throw new ApiError(
        502,
        "AI provider rate limit exceeded. Please try again later."
      );
    }
    throw new ApiError(
      502,
      `AI provider returned an error (${status}). Please try again later.`
    );
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      502,
      "AI provider returned an invalid response. Please try again later."
    );
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new ApiError(
      502,
      "AI provider returned an empty response. Please try again."
    );
  }

  return { content, config };
}

function parseAiJson(rawContent) {
  let jsonStr = rawContent.trim();

  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/, "");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new ApiError(
      502,
      "AI returned invalid JSON. Please try again or refine your idea."
    );
  }

  return parsed;
}

async function generatePlatformMetadata(
  userId,
  { idea, category, targetPlatforms, language }
) {
  if (!env.aiMetadataEnabled) {
    throw new ApiError(503, "AI metadata generation is currently disabled.");
  }

  let profile;
  try {
    profile = await aiBrandProfileService.getOrCreateProfile(userId);
  } catch {
    profile = aiBrandProfileService.DEFAULT_PROFILE;
  }

  const outputLanguage = language || profile.language || "ar";

  const systemPrompt = buildSystemPrompt(profile);
  const userPrompt = buildUserPrompt(idea, category, outputLanguage, targetPlatforms);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const { content, config } = await callAiProvider(messages);

  const rawOutput = parseAiJson(content);
  const result = aiOutputSchema.safeParse(rawOutput);

  if (!result.success) {
    await logAttempt(userId, {
      input: { idea, category, targetPlatforms, language: outputLanguage },
      status: "failed",
      errorMessage: "AI output failed schema validation",
      provider: config.provider,
      model: config.model,
    });
    throw new ApiError(
      502,
      "AI returned an invalid response structure. Please try again or refine your idea."
    );
  }

  const filtered = {};
  for (const platform of targetPlatforms) {
    if (result.data[platform]) {
      filtered[platform] = result.data[platform];
    }
  }

  await logAttempt(userId, {
    input: { idea, category, targetPlatforms, language: outputLanguage },
    output: filtered,
    status: "success",
    provider: config.provider,
    model: config.model,
  });

  return filtered;
}

async function logAttempt(userId, data) {
  try {
    await prisma.aiGenerationAttempt.create({
      data: {
        userId,
        type: "platform_metadata",
        input: data.input,
        output: data.output || null,
        status: data.status,
        errorMessage: data.errorMessage || null,
        provider: data.provider,
        model: data.model || null,
      },
    });
  } catch {
    // Logging failure must never break the main flow
  }
}

module.exports = {
  generatePlatformMetadata,
};
