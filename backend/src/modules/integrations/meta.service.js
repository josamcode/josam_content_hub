const crypto = require("crypto");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const { decryptToken, encryptToken } = require("../../utils/tokenCrypto");

const META_PLATFORM = "facebook";
const META_GRAPH_API_VERSION = "v22.0";
const META_GRAPH_API_BASE = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;
const STATE_TTL_MS = 10 * 60 * 1000;

// Verify scopes from current Meta docs before production use.
const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

const oauthStateStore = new Map();

const platformAccountSelect = {
  platform: true,
  accountId: true,
  accountName: true,
  scopes: true,
  status: true,
  tokenExpiresAt: true,
  connectedAt: true,
  lastError: true,
  metadata: true,
};

// ---------------------------------------------------------------------------
// OAuth state helpers
// ---------------------------------------------------------------------------

function pruneExpiredStates(now = Date.now()) {
  for (const [state, entry] of oauthStateStore.entries()) {
    if (entry.expiresAt <= now) {
      oauthStateStore.delete(state);
    }
  }
}

function createOAuthState(userId) {
  pruneExpiredStates();

  const nonce = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + STATE_TTL_MS;

  oauthStateStore.set(nonce, {
    userId,
    nonce,
    createdAt: new Date(now),
    expiresAt,
  });

  return nonce;
}

function consumeOAuthState(state) {
  pruneExpiredStates();

  if (!state) {
    throw new ApiError(400, "OAuth state is required");
  }

  const entry = oauthStateStore.get(state);
  oauthStateStore.delete(state);

  if (!entry || entry.expiresAt <= Date.now()) {
    throw new ApiError(400, "Invalid or expired OAuth state");
  }

  return entry;
}

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function hasOAuthConfig() {
  return Boolean(env.metaAppId && env.metaAppSecret && env.metaRedirectUri);
}

function ensureOAuthConfig() {
  if (!hasOAuthConfig()) {
    throw new ApiError(500, "Meta OAuth is not configured");
  }
}

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------

function buildGraphUrl(path, params = {}) {
  const url = new URL(`${META_GRAPH_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function graphGet(path, accessToken, params = {}) {
  const url = buildGraphUrl(path, { ...params, access_token: accessToken });

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new ApiError(502, "Failed to reach Meta API");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, "Invalid response from Meta API");
  }

  if (data && data.error) {
    const message = data.error.message || "Meta API request failed";
    throw new ApiError(502, `Meta API error: ${message}`);
  }

  return data;
}

async function graphPost(path, accessToken, body = {}) {
  const url = buildGraphUrl(path, { access_token: accessToken });

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(502, "Failed to reach Meta API");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, "Invalid response from Meta API");
  }

  if (data && data.error) {
    const message = data.error.message || "Meta API request failed";
    throw new ApiError(502, `Meta API error: ${message}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auth URL builder
// ---------------------------------------------------------------------------

function buildAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: env.metaAppId,
    redirect_uri: env.metaRedirectUri,
    state,
    scope: META_SCOPES.join(","),
    response_type: "code",
  });

  return `https://www.facebook.com/${META_GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Token encryption wrapper
// ---------------------------------------------------------------------------

function encryptTokenForStorage(token) {
  try {
    return encryptToken(token);
  } catch {
    throw new ApiError(500, "Token encryption is not configured");
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fetchLongLivedToken(shortLivedToken) {
  try {
    const data = await graphGet("oauth/access_token", null, {
      grant_type: "fb_exchange_token",
      client_id: env.metaAppId,
      client_secret: env.metaAppSecret,
      fb_exchange_token: shortLivedToken,
    });
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || null,
    };
  } catch {
    // Long-lived exchange failed; return the short-lived token as fallback
    return {
      accessToken: shortLivedToken,
      expiresIn: null,
    };
  }
}

async function fetchUserInfo(accessToken) {
  try {
    const data = await graphGet("me", accessToken);
    return {
      id: data.id,
      name: data.name,
    };
  } catch {
    return null;
  }
}

async function fetchPages(accessToken) {
  try {
    const data = await graphGet("me/accounts", accessToken);

    if (!data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((page) => ({
      id: page.id,
      name: page.name,
      category: page.category || null,
      accessToken: page.access_token || null,
    }));
  } catch {
    return [];
  }
}

async function fetchInstagramBusinessAccount(pageAccessToken, pageId) {
  try {
    const data = await graphGet(pageId, pageAccessToken, {
      fields: "instagram_business_account",
    });

    if (data && data.instagram_business_account) {
      const igId = data.instagram_business_account.id;
      // Fetch username for the Instagram account
      let username = null;
      try {
        const igData = await graphGet(igId, pageAccessToken, {
          fields: "username",
        });
        username = igData.username || null;
      } catch {
        // username fetch is best-effort
      }
      return { id: igId, username };
    }

    return null;
  } catch {
    return null;
  }
}

function buildSafeMetadata(metaUserId, metaUserName, tokenType, expiresAt, availablePages) {
  return {
    metaUserId: metaUserId || null,
    metaUserName: metaUserName || null,
    tokenType: tokenType || null,
    expiresAt: expiresAt || null,
    availablePages: (availablePages || []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category || null,
      instagramBusinessAccount: p.instagramBusinessAccount || null,
    })),
    selectedPageId: null,
    selectedPageName: null,
    instagramBusinessAccountId: null,
    instagramUsername: null,
  };
}

function sanitizeAvailablePages(metadata) {
  if (!metadata || !Array.isArray(metadata.availablePages)) {
    return [];
  }

  return metadata.availablePages.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || null,
    instagramBusinessAccount: p.instagramBusinessAccount || null,
  }));
}

function formatConnectionStatus(account) {
  if (!account) {
    return {
      platform: META_PLATFORM,
      connected: false,
      status: "disconnected",
      accountName: null,
      accountId: null,
      scopes: [],
      tokenExpiresAt: null,
      selectedPage: null,
      instagramAccount: null,
      availablePages: [],
      lastError: null,
    };
  }

  const metadata = account.metadata || {};

  return {
    platform: account.platform,
    connected: account.status === "connected",
    status: account.status,
    accountName: account.accountName,
    accountId: account.accountId,
    scopes: account.scopes,
    tokenExpiresAt: account.tokenExpiresAt,
    selectedPage: metadata.selectedPageId
      ? {
          id: metadata.selectedPageId,
          name: metadata.selectedPageName || null,
        }
      : null,
    instagramAccount: metadata.instagramBusinessAccountId
      ? {
          id: metadata.instagramBusinessAccountId,
          username: metadata.instagramUsername || null,
        }
      : null,
    availablePages: sanitizeAvailablePages(metadata),
    lastError: account.lastError,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

async function startConnect(userId) {
  ensureOAuthConfig();

  const state = createOAuthState(userId);
  const authorizationUrl = buildAuthorizationUrl(state);

  return { authorizationUrl };
}

async function handleCallback({ code, state, error }) {
  if (error) {
    consumeOAuthState(state);
    throw new ApiError(400, "Meta authorization was denied or failed");
  }

  if (!code) {
    if (state) {
      consumeOAuthState(state);
    }
    throw new ApiError(422, "Authorization code is required");
  }

  const stateEntry = consumeOAuthState(state);
  ensureOAuthConfig();

  // Exchange code for short-lived access token
  let tokenResponse;
  try {
    tokenResponse = await graphGet("oauth/access_token", null, {
      client_id: env.metaAppId,
      client_secret: env.metaAppSecret,
      redirect_uri: env.metaRedirectUri,
      code,
    });
  } catch (tokenError) {
    throw new ApiError(502, "Failed to exchange Meta authorization code");
  }

  if (!tokenResponse || !tokenResponse.access_token) {
    throw new ApiError(502, "Meta did not return an access token");
  }

  const shortLivedToken = tokenResponse.access_token;

  // Exchange for long-lived token
  const { accessToken, expiresIn } = await fetchLongLivedToken(shortLivedToken);

  // Fetch user info
  const userInfo = await fetchUserInfo(accessToken);

  // Fetch pages with their access tokens
  const pages = await fetchPages(accessToken);

  // For each page, optionally fetch linked Instagram account
  const availablePages = [];
  for (const page of pages) {
    let igAccount = null;
    try {
      igAccount = await fetchInstagramBusinessAccount(page.accessToken, page.id);
    } catch {
      // instagram lookup is best-effort
    }
    availablePages.push({
      id: page.id,
      name: page.name,
      category: page.category,
      instagramBusinessAccount: igAccount,
    });
  }

  const metadata = buildSafeMetadata(
    userInfo?.id || null,
    userInfo?.name || null,
    "long_lived",
    expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    availablePages
  );

  const accessTokenEncrypted = encryptTokenForStorage(accessToken);
  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  // First upsert with user token
  const account = await prisma.platformAccount.upsert({
    where: {
      userId_platform: {
        userId: stateEntry.userId,
        platform: META_PLATFORM,
      },
    },
    update: {
      accessTokenEncrypted,
      refreshTokenEncrypted: null,
      tokenExpiresAt,
      scopes: META_SCOPES,
      status: "connected",
      accountName: userInfo?.name || "Facebook",
      accountId: userInfo?.id || null,
      lastError: null,
      metadata,
      connectedAt: new Date(),
    },
    create: {
      userId: stateEntry.userId,
      platform: META_PLATFORM,
      accessTokenEncrypted,
      refreshTokenEncrypted: null,
      tokenExpiresAt,
      scopes: META_SCOPES,
      status: "connected",
      accountName: userInfo?.name || "Facebook",
      accountId: userInfo?.id || null,
      lastError: null,
      metadata,
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(account);
}

async function getStatus(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(account);
}

async function getPages(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    select: {
      ...platformAccountSelect,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
    },
  });

  if (!account || account.status !== "connected") {
    throw new ApiError(400, "Meta account is not connected");
  }

  const metadata = account.metadata || {};

  // Use the user token for fetching pages. After page selection,
  // accessTokenEncrypted holds the page token and refreshTokenEncrypted
  // holds the user token. Before selection, only accessTokenEncrypted is set.
  const userToken = account.refreshTokenEncrypted || account.accessTokenEncrypted;
  if (userToken) {
    try {
      const accessToken = decryptToken(userToken);
      const pages = await fetchPages(accessToken);

      if (pages.length > 0) {
        const availablePages = [];
        for (const page of pages) {
          let igAccount = null;
          try {
            igAccount = await fetchInstagramBusinessAccount(page.accessToken, page.id);
          } catch {
            // best-effort
          }
          availablePages.push({
            id: page.id,
            name: page.name,
            category: page.category,
            instagramBusinessAccount: igAccount,
          });
        }

        const updatedMetadata = {
          ...metadata,
          availablePages,
        };

        await prisma.platformAccount.update({
          where: {
            userId_platform: {
              userId,
              platform: META_PLATFORM,
            },
          },
          data: { metadata: updatedMetadata },
        });

        return {
          availablePages: sanitizeAvailablePages(updatedMetadata),
          selectedPage: metadata.selectedPageId
            ? {
                id: metadata.selectedPageId,
                name: metadata.selectedPageName || null,
                instagramBusinessAccountId: metadata.instagramBusinessAccountId || null,
                instagramUsername: metadata.instagramUsername || null,
              }
            : null,
        };
      }
    } catch {
      // Fall through to return stored pages
    }
  }

  return {
    availablePages: sanitizeAvailablePages(metadata),
    selectedPage: metadata.selectedPageId
      ? {
          id: metadata.selectedPageId,
          name: metadata.selectedPageName || null,
          instagramBusinessAccountId: metadata.instagramBusinessAccountId || null,
          instagramUsername: metadata.instagramUsername || null,
        }
      : null,
  };
}

async function selectPage(userId, pageId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    select: {
      ...platformAccountSelect,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
    },
  });

  if (!account || account.status !== "connected") {
    throw new ApiError(400, "Meta account is not connected");
  }

  const metadata = account.metadata || {};
  const availablePages = metadata.availablePages || [];

  // Use the user token for Meta API calls. After a previous page selection,
  // accessTokenEncrypted holds the page token and refreshTokenEncrypted holds
  // the user token.
  const userTokenForApi = account.refreshTokenEncrypted || account.accessTokenEncrypted;

  // Try to find page in stored metadata first
  let selectedPage = availablePages.find((p) => p.id === pageId);

  // If not found, try refreshing pages from Meta and look again
  if (!selectedPage && userTokenForApi) {
    try {
      const accessToken = decryptToken(userTokenForApi);
      const freshPages = await fetchPages(accessToken);

      if (freshPages.length > 0) {
        // Refresh available pages in metadata
        const refreshedPages = [];
        for (const page of freshPages) {
          let igAccount = null;
          try {
            igAccount = await fetchInstagramBusinessAccount(page.accessToken, page.id);
          } catch {
            // best-effort
          }
          refreshedPages.push({
            id: page.id,
            name: page.name,
            category: page.category,
            instagramBusinessAccount: igAccount,
          });
        }
        metadata.availablePages = refreshedPages;
        selectedPage = refreshedPages.find((p) => p.id === pageId);
      }
    } catch {
      // Fall through
    }
  }

  if (!selectedPage) {
    throw new ApiError(404, "Page not found in available pages");
  }

  // Attempt to get a page access token from Meta.
  // Use the user token (refreshTokenEncrypted or accessTokenEncrypted) for the
  // /me/accounts call, then swap: page token → accessTokenEncrypted,
  // user token → refreshTokenEncrypted (preserve if already set).
  let pageAccessToken = null;
  if (userTokenForApi) {
    try {
      const accessToken = decryptToken(userTokenForApi);
      const pages = await fetchPages(accessToken);
      const pageWithToken = pages.find((p) => p.id === pageId);

      if (pageWithToken && pageWithToken.accessToken) {
        pageAccessToken = pageWithToken.accessToken;
        // Swap: page token → accessTokenEncrypted, user token → refreshTokenEncrypted
        account.refreshTokenEncrypted = account.refreshTokenEncrypted || account.accessTokenEncrypted;
        account.accessTokenEncrypted = encryptTokenForStorage(pageAccessToken);
      }
    } catch {
      // If page token fetch fails, continue with stored token
    }
  }

  // Determine Instagram info
  let instagramBusinessAccountId = null;
  let instagramUsername = null;
  if (selectedPage.instagramBusinessAccount) {
    instagramBusinessAccountId = selectedPage.instagramBusinessAccount.id || null;
    instagramUsername = selectedPage.instagramBusinessAccount.username || null;
  }

  const updatedMetadata = {
    ...metadata,
    selectedPageId: pageId,
    selectedPageName: selectedPage.name,
    instagramBusinessAccountId,
    instagramUsername,
  };

  const updatedAccount = await prisma.platformAccount.update({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    data: {
      accountId: pageId,
      accountName: selectedPage.name,
      accessTokenEncrypted: account.accessTokenEncrypted,
      refreshTokenEncrypted: account.refreshTokenEncrypted || null,
      metadata: updatedMetadata,
      lastError: null,
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(updatedAccount);
}

async function disconnect(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    select: {
      accessTokenEncrypted: true,
      metadata: true,
    },
  });

  if (!account) {
    return formatConnectionStatus(null);
  }

  let lastError = null;

  // Best-effort revoke Meta permissions
  if (account.accessTokenEncrypted) {
    try {
      const accessToken = decryptToken(account.accessTokenEncrypted);
      const metadata = account.metadata || {};
      const userIdMeta = metadata.metaUserId;

      if (userIdMeta) {
        await fetch(
          buildGraphUrl(`${userIdMeta}/permissions`, { access_token: accessToken }),
          { method: "DELETE" }
        );
      }
    } catch {
      lastError = "Meta permission revoke failed; local tokens were cleared.";
    }
  }

  const updatedAccount = await prisma.platformAccount.update({
    where: {
      userId_platform: {
        userId,
        platform: META_PLATFORM,
      },
    },
    data: {
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      status: "revoked",
      lastError,
      metadata: {
        selectedPageId: null,
        selectedPageName: null,
        instagramBusinessAccountId: null,
        instagramUsername: null,
      },
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(updatedAccount);
}

module.exports = {
  META_PLATFORM,
  META_SCOPES,
  disconnect,
  getPages,
  getStatus,
  handleCallback,
  selectPage,
  startConnect,
};
