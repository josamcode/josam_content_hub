#!/usr/bin/env node

// Read-only smoke check for production/staging. The only POST is auth login.
// The optional media check uses HEAD to avoid downloading large files.

const dotenv = require("dotenv");

dotenv.config();

const API_BASE_URL =
  process.env.SMOKE_API_BASE_URL || "http://localhost:5000/api/v1";
const USER_EMAIL = process.env.SMOKE_USER_EMAIL;
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD;
const FRONTEND_URL = process.env.SMOKE_FRONTEND_URL;
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

const results = [];
const warnings = [];

function requireRuntime(name, value) {
  if (!value) {
    throw new Error(`${name} is required`);
  }
}

function makeApiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}

function getApiOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function buildMediaUrl(fileUrl) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  const origin = getApiOrigin();
  if (!origin) return "";

  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${origin}${path}`;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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

async function apiRequest(path, { token } = {}) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchWithTimeout(makeApiUrl(path), {
    method: "GET",
    headers,
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    const details =
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    throw new Error(`GET ${path} failed (${response.status}): ${details}`);
  }

  return payload;
}

async function login() {
  const response = await fetchWithTimeout(makeApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    }),
  });
  const payload = await readResponse(response);

  if (!response.ok) {
    throw new Error(`POST /auth/login failed (${response.status})`);
  }

  return payload;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function step(label, fn) {
  try {
    const result = await fn();
    results.push({ label, status: "passed" });
    console.log(`PASS ${label}`);
    return result;
  } catch (error) {
    results.push({ label, status: "failed", message: error.message });
    console.error(`FAIL ${label}`);
    console.error(error.message || error);
    throw error;
  }
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN ${message}`);
}

async function checkJsonSuccess(label, path, token, validateData) {
  return step(label, async () => {
    const result = await apiRequest(path, { token });
    assert(result?.success === true, `${path} did not return success=true`);
    assert(
      Object.prototype.hasOwnProperty.call(result, "data"),
      `${path} did not include data`
    );

    if (validateData) {
      validateData(result);
    }

    return result;
  });
}

async function checkMediaUrl(fileUrl) {
  const mediaUrl = buildMediaUrl(fileUrl);

  if (!mediaUrl) {
    warn("Media asset had no usable file URL; skipped media URL check.");
    return;
  }

  try {
    const response = await fetchWithTimeout(mediaUrl, { method: "HEAD" });

    if (response.status === 405 || response.status === 501) {
      warn("Media server does not support HEAD; skipped media URL check.");
      return;
    }

    assert(
      response.ok,
      `Media HEAD failed (${response.status}) for ${mediaUrl}`
    );

    results.push({ label: "Media URL reachable with HEAD", status: "passed" });
    console.log("PASS Media URL reachable with HEAD");
  } catch (error) {
    warn(`Media URL check failed: ${error.message || error}`);
  }
}

async function checkFrontend() {
  if (!FRONTEND_URL) return;

  try {
    const response = await fetchWithTimeout(FRONTEND_URL, { method: "GET" });
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    assert(response.ok, `Frontend root failed (${response.status})`);
    assert(
      contentType.includes("text/html") || /<html[\s>]/i.test(body),
      "Frontend root did not look like HTML"
    );

    results.push({ label: "Frontend root reachable", status: "passed" });
    console.log("PASS Frontend root reachable");
  } catch (error) {
    warn(`Frontend root check failed: ${error.message || error}`);
  }
}

async function main() {
  if (typeof fetch !== "function") {
    throw new Error("Native fetch is required. Use Node.js 18 or newer.");
  }

  requireRuntime("SMOKE_USER_EMAIL", USER_EMAIL);
  requireRuntime("SMOKE_USER_PASSWORD", USER_PASSWORD);

  console.log("Starting read-only smoke check.");
  console.log(`API base URL: ${API_BASE_URL}`);

  await checkJsonSuccess("Health check", "/health", null, (result) => {
    assert(result.data?.status === "ok", "Health data.status was not ok");
  });

  const loginResult = await step("Login", async () => {
    const result = await login();
    assert(result?.success === true, "Login did not return success=true");
    assert(result?.data?.token, "Login response did not include a token");
    return result;
  });

  const token = loginResult.data.token;

  await checkJsonSuccess("Current user", "/auth/me", token);
  await checkJsonSuccess("Dashboard", "/dashboard", token);

  const contentList = await checkJsonSuccess(
    "Content list",
    "/content-items?limit=5",
    token,
    (result) => {
      assert(Array.isArray(result.data), "Content list data was not an array");
      assert(result.meta, "Content list did not include meta");
    }
  );

  const from = formatDate(addDays(new Date(), -1));
  const to = formatDate(addDays(new Date(), 7));

  await checkJsonSuccess(
    "Calendar",
    `/calendar?from=${from}&to=${to}`,
    token,
    (result) => {
      assert(Array.isArray(result.data), "Calendar data was not an array");
    }
  );
  await checkJsonSuccess("Today reminders", "/reminders?range=today", token, (result) => {
    assert(Array.isArray(result.data), "Reminders data was not an array");
  });
  await checkJsonSuccess(
    "Publish attempts",
    "/publish-attempts?limit=5",
    token,
    (result) => {
      assert(Array.isArray(result.data), "Publish attempts data was not an array");
      assert(result.meta, "Publish attempts did not include meta");
    }
  );
  await checkJsonSuccess("Active queue slots", "/queue-slots?active=true", token, (result) => {
    assert(Array.isArray(result.data), "Queue slot data was not an array");
  });
  await checkJsonSuccess("Platform settings", "/platform-settings", token, (result) => {
    assert(Array.isArray(result.data), "Platform settings data was not an array");
  });
  await checkJsonSuccess("Category defaults", "/category-defaults", token, (result) => {
    assert(Array.isArray(result.data), "Category defaults data was not an array");
  });

  const firstContentItem = contentList.data[0];

  if (firstContentItem?.id) {
    await checkJsonSuccess(
      "Content detail",
      `/content-items/${encodeURIComponent(firstContentItem.id)}`,
      token
    );

    const mediaList = await checkJsonSuccess(
      "Content media list",
      `/content-items/${encodeURIComponent(firstContentItem.id)}/media`,
      token,
      (result) => {
        assert(Array.isArray(result.data), "Media list data was not an array");
      }
    );

    const mediaAsset = mediaList.data.find((item) => item?.fileUrl);
    if (mediaAsset) {
      await checkMediaUrl(mediaAsset.fileUrl);
    } else {
      warn("First content item had no media asset with fileUrl; skipped media URL check.");
    }
  } else {
    warn("Content list was empty; skipped content detail and media URL checks.");
  }

  await checkFrontend();

  console.log("Read-only smoke check completed.");
  console.log(`Passed checks: ${results.filter((item) => item.status === "passed").length}`);

  if (warnings.length > 0) {
    console.log(`Warnings: ${warnings.length}`);
    warnings.forEach((message) => console.log(`- ${message}`));
  }
}

main().catch((error) => {
  console.error(`Read-only smoke check failed: ${error.message || error}`);
  process.exit(1);
});
