#!/usr/bin/env node

// Run only against local/staging database, not production unless intentional.

const dotenv = require("dotenv");

dotenv.config();

const API_BASE_URL =
  process.env.SMOKE_API_BASE_URL || "http://localhost:5000/api/v1";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || process.env.SEED_USER_EMAIL;
const USER_PASSWORD =
  process.env.SMOKE_USER_PASSWORD || process.env.SEED_USER_PASSWORD;
const TIMEZONE = "Africa/Cairo";

function requireRuntime(name, value) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function makeUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiRequest(path, { method = "GET", token, body, form } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  if (form) {
    options.body = form;
  }

  const response = await fetch(makeUrl(path), options);
  const payload = await readResponse(response);

  if (!response.ok) {
    const details =
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    throw new Error(`${method} ${path} failed (${response.status}): ${details}`);
  }

  return payload;
}

async function step(label, fn) {
  try {
    const result = await fn();
    console.log(`✓ ${label}`);
    return result;
  } catch (error) {
    console.error(`✗ ${label}`);
    console.error(error.message || error);
    process.exitCode = 1;
    throw error;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findById(list, id, field = "id") {
  return Array.isArray(list) ? list.find((item) => item?.[field] === id) : null;
}

function buildMediaForm({ type, fileName, mimeType, bytes }) {
  const form = new FormData();
  const blob = new Blob([Buffer.from(bytes)], { type: mimeType });

  form.append("type", type);
  form.append("file", blob, fileName);

  return form;
}

async function createUniqueQueueSlot(token) {
  const now = new Date();

  for (let index = 0; index < 28; index += 1) {
    const time = new Date(now.getTime() + (index + 4) * 60 * 60 * 1000);
    const hour = String(time.getUTCHours()).padStart(2, "0");
    const minute = String((time.getUTCMinutes() + index) % 60).padStart(2, "0");
    const dayOfWeek = (now.getUTCDay() + index) % 7;

    try {
      return await apiRequest("/queue-slots", {
        method: "POST",
        token,
        body: {
          platform: "facebook",
          dayOfWeek,
          timeOfDay: `${hour}:${minute}`,
          timezone: TIMEZONE,
        },
      });
    } catch (error) {
      if (!error.message.includes("(409)")) {
        throw error;
      }
    }
  }

  throw new Error("Could not create a unique queue slot after multiple tries");
}

async function main() {
  requireRuntime("SMOKE_USER_EMAIL or SEED_USER_EMAIL", USER_EMAIL);
  requireRuntime("SMOKE_USER_PASSWORD or SEED_USER_PASSWORD", USER_PASSWORD);

  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

  await step("Health check passed", async () => {
    const result = await apiRequest("/health");
    assert(result?.success, "Health endpoint did not return success");
  });

  const token = await step("Login passed", async () => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: USER_EMAIL,
        password: USER_PASSWORD,
      },
    });
    assert(result?.data?.token, "Login response did not include a token");
    return result.data.token;
  });

  const contentItem = await step("Content created", async () => {
    const result = await apiRequest("/content-items", {
      method: "POST",
      token,
      body: {
        title: `Smoke Test Content ${stamp}`,
        category: "personal_brand",
        hook: "Smoke test content item.",
        script: "Smoke test script body.",
        notes: "Created by backend smoke test.",
        targetPlatforms: ["tiktok", "instagram", "youtube"],
      },
    });
    assert(result?.data?.id, "Create content response did not include an id");
    return result.data;
  });

  const tiktokPost = await step("Platform posts loaded", async () => {
    const result = await apiRequest(
      `/content-items/${contentItem.id}/platform-posts`,
      { token }
    );
    const posts = result?.data || [];
    const post = posts.find((item) => item.platform === "tiktok");
    assert(post?.id, "TikTok platform post was not created");
    return post;
  });

  await step("TikTok platform post updated", async () => {
    const result = await apiRequest(`/platform-posts/${tiktokPost.id}`, {
      method: "PATCH",
      token,
      body: {
        caption: `Smoke test TikTok caption ${stamp}`,
        hashtags: ["smoketest", "josam"],
        status: "ready",
      },
    });
    assert(result?.data?.status === "ready", "TikTok post was not ready");
  });

  const schedule = await step("TikTok scheduled manually", async () => {
    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const result = await apiRequest(`/platform-posts/${tiktokPost.id}/schedule`, {
      method: "POST",
      token,
      body: {
        scheduledAt,
        timezone: TIMEZONE,
        publishMode: "manual",
      },
    });
    assert(result?.data?.id, "Schedule response did not include an id");
    return result.data;
  });

  await step("Calendar contains schedule", async () => {
    const from = formatDate(addDays(new Date(), -1));
    const to = formatDate(addDays(new Date(), 1));
    const result = await apiRequest(`/calendar?from=${from}&to=${to}`, {
      token,
    });
    const hit = findById(result?.data, tiktokPost.id, "platformPostId");
    assert(hit, "Calendar did not include the TikTok schedule");
  });

  await step("Reminder exists", async () => {
    const result = await apiRequest("/reminders?range=today", { token });
    const reminder = Array.isArray(result?.data)
      ? result.data.find((item) => item?.platformPost?.id === tiktokPost.id)
      : null;
    assert(reminder, "Today reminders did not include the TikTok post");
  });

  await step("Manual publish completed", async () => {
    const result = await apiRequest("/publish/manual-complete", {
      method: "POST",
      token,
      body: {
        platformPostId: tiktokPost.id,
        scheduleId: schedule.id,
        platformPostUrl: `https://www.tiktok.com/@josam/video/smoke-${stamp}`,
      },
    });
    assert(
      result?.data?.status === "manual_done",
      "Manual publish did not mark the post done"
    );
  });

  await step("Publish logs contain attempt", async () => {
    const result = await apiRequest("/publish-attempts?page=1&limit=10", {
      token,
    });
    const hit = findById(result?.data, tiktokPost.id, "platformPostId");
    assert(hit, "Publish attempts did not include the manual completion");
  });

  await step("Queue slot add/edit/deactivate passed", async () => {
    const created = await createUniqueQueueSlot(token);
    const queueSlot = created?.data;
    assert(queueSlot?.id, "Queue slot response did not include an id");

    const updated = await apiRequest(`/queue-slots/${queueSlot.id}`, {
      method: "PATCH",
      token,
      body: {
        timezone: "UTC",
      },
    });
    assert(updated?.data?.timezone === "UTC", "Queue slot was not updated");

    await apiRequest(`/queue-slots/${queueSlot.id}`, {
      method: "DELETE",
      token,
    });
  });

  await step("Media upload passed", async () => {
    assert(
      typeof FormData !== "undefined" && typeof Blob !== "undefined",
      "Native FormData/Blob are not available in this Node runtime"
    );

    const thumbnail = await apiRequest(`/content-items/${contentItem.id}/media`, {
      method: "POST",
      token,
      form: buildMediaForm({
        type: "thumbnail",
        fileName: "smoke-thumbnail.png",
        mimeType: "image/png",
        bytes: [137, 80, 78, 71, 13, 10, 26, 10],
      }),
    });

    assert(
      thumbnail?.data?.type === "thumbnail",
      "Thumbnail upload did not return thumbnail type"
    );

    const video = await apiRequest(`/content-items/${contentItem.id}/media`, {
      method: "POST",
      token,
      form: buildMediaForm({
        type: "video",
        fileName: "smoke-video.mp4",
        mimeType: "video/mp4",
        bytes: [0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50],
      }),
    });

    assert(video?.data?.type === "video", "Video upload did not return video type");
  });

  console.log("Smoke test passed.");
}

main().catch(() => {
  process.exit(process.exitCode || 1);
});
