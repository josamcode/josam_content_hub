const crypto = require("crypto");
const { google } = require("googleapis");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");
const { decryptToken, encryptToken } = require("../../utils/tokenCrypto");

const YOUTUBE_PLATFORM = "youtube";
const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const STATE_TTL_MS = 10 * 60 * 1000;

// Single-instance MVP state store. Move this to DB/Redis before scaling out.
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
};

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

function hasOAuthConfig() {
  return Boolean(
    env.googleClientId && env.googleClientSecret && env.googleRedirectUri
  );
}

function ensureOAuthConfig() {
  if (!hasOAuthConfig()) {
    throw new ApiError(500, "YouTube OAuth is not configured");
  }
}

function createOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

function parseScopes(scopeValue) {
  if (!scopeValue || typeof scopeValue !== "string") {
    return [];
  }

  return scopeValue
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

async function resolveGrantedScopes(oauth2Client, tokens) {
  const tokenResponseScopes = parseScopes(tokens.scope);

  if (tokenResponseScopes.length > 0) {
    return tokenResponseScopes;
  }

  if (!tokens.access_token) {
    return [];
  }

  try {
    const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
    return Array.isArray(tokenInfo.scopes)
      ? tokenInfo.scopes
      : parseScopes(tokenInfo.scope);
  } catch (error) {
    return [];
  }
}

function ensureRequiredScope(scopes) {
  if (!scopes.includes(YOUTUBE_UPLOAD_SCOPE)) {
    throw new ApiError(422, "Required YouTube OAuth scope was not granted");
  }
}

function encryptTokenForStorage(token) {
  try {
    return encryptToken(token);
  } catch (error) {
    throw new ApiError(500, "Token encryption is not configured");
  }
}

function formatConnectionStatus(account) {
  if (!account) {
    return {
      platform: YOUTUBE_PLATFORM,
      connected: false,
      status: "disconnected",
      accountName: null,
      accountId: null,
      scopes: [],
      tokenExpiresAt: null,
      connectedAt: null,
      lastError: null,
    };
  }

  return {
    platform: account.platform,
    connected: account.status === "connected",
    status: account.status,
    accountName: account.accountName,
    accountId: account.accountId,
    scopes: account.scopes,
    tokenExpiresAt: account.tokenExpiresAt,
    connectedAt: account.connectedAt,
    lastError: account.lastError,
  };
}

async function startConnect(userId) {
  ensureOAuthConfig();

  const oauth2Client = createOAuthClient();
  const state = createOAuthState(userId);
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [YOUTUBE_UPLOAD_SCOPE],
    state,
  });

  return { authorizationUrl };
}

async function handleCallback({ code, state, error }) {
  if (error) {
    consumeOAuthState(state);
    throw new ApiError(400, "YouTube authorization was denied or failed");
  }

  if (!code) {
    if (state) {
      consumeOAuthState(state);
    }

    throw new ApiError(422, "Authorization code is required");
  }

  const stateEntry = consumeOAuthState(state);
  ensureOAuthConfig();

  const oauth2Client = createOAuthClient();
  let tokens;

  try {
    const tokenResponse = await oauth2Client.getToken(code);
    tokens = tokenResponse.tokens;
  } catch (tokenError) {
    throw new ApiError(502, "Failed to exchange YouTube authorization code");
  }

  if (!tokens.access_token) {
    throw new ApiError(502, "YouTube did not return an access token");
  }

  oauth2Client.setCredentials(tokens);

  const scopes = await resolveGrantedScopes(oauth2Client, tokens);
  ensureRequiredScope(scopes);

  const existingAccount = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId: stateEntry.userId,
        platform: YOUTUBE_PLATFORM,
      },
    },
    select: {
      refreshTokenEncrypted: true,
    },
  });

  const accessTokenEncrypted = encryptTokenForStorage(tokens.access_token);
  const refreshTokenEncrypted = tokens.refresh_token
    ? encryptTokenForStorage(tokens.refresh_token)
    : existingAccount?.refreshTokenEncrypted || null;
  const tokenExpiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : null;

  const account = await prisma.platformAccount.upsert({
    where: {
      userId_platform: {
        userId: stateEntry.userId,
        platform: YOUTUBE_PLATFORM,
      },
    },
    update: {
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      scopes,
      status: "connected",
      accountName: "YouTube",
      lastError: null,
      connectedAt: new Date(),
    },
    create: {
      userId: stateEntry.userId,
      platform: YOUTUBE_PLATFORM,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt,
      scopes,
      status: "connected",
      accountName: "YouTube",
      lastError: null,
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
        platform: YOUTUBE_PLATFORM,
      },
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(account);
}

async function disconnect(userId) {
  const account = await prisma.platformAccount.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: YOUTUBE_PLATFORM,
      },
    },
    select: {
      accessTokenEncrypted: true,
    },
  });

  if (!account) {
    return formatConnectionStatus(null);
  }

  let lastError = null;

  if (account.accessTokenEncrypted) {
    try {
      const accessToken = decryptToken(account.accessTokenEncrypted);
      const oauth2Client = createOAuthClient();
      await oauth2Client.revokeToken(accessToken);
    } catch (error) {
      lastError = "Google token revoke failed; local tokens were cleared.";
    }
  }

  const updatedAccount = await prisma.platformAccount.update({
    where: {
      userId_platform: {
        userId,
        platform: YOUTUBE_PLATFORM,
      },
    },
    data: {
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      status: "revoked",
      lastError,
    },
    select: platformAccountSelect,
  });

  return formatConnectionStatus(updatedAccount);
}

module.exports = {
  YOUTUBE_UPLOAD_SCOPE,
  disconnect,
  getStatus,
  handleCallback,
  startConnect,
};
