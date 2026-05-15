const crypto = require("crypto");

const env = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_HEX_LENGTH = 64;
const PAYLOAD_VERSION = "v1";

function getEncryptionKey() {
  const key = env.tokenEncryptionKey;

  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required for OAuth token storage");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex characters");
  }

  const buffer = Buffer.from(key, "hex");

  if (buffer.length !== KEY_HEX_LENGTH / 2) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");
  }

  return buffer;
}

function encryptToken(plainText) {
  if (typeof plainText !== "string" || plainText.length === 0) {
    throw new Error("Token plaintext must be a non-empty string");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const cipherText = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    PAYLOAD_VERSION,
    iv.toString("hex"),
    tag.toString("hex"),
    cipherText.toString("hex"),
  ].join(":");
}

function decryptToken(payload) {
  if (typeof payload !== "string" || payload.length === 0) {
    throw new Error("Encrypted token payload must be a non-empty string");
  }

  const [version, ivHex, tagHex, cipherTextHex, extra] = payload.split(":");

  if (extra !== undefined || version !== PAYLOAD_VERSION) {
    throw new Error("Unsupported encrypted token payload format");
  }

  if (!ivHex || !tagHex || !cipherTextHex) {
    throw new Error("Encrypted token payload is incomplete");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const cipherText = Buffer.from(cipherTextHex, "hex");

  if (iv.length !== IV_BYTES || tag.length !== 16 || cipherText.length === 0) {
    throw new Error("Encrypted token payload has invalid parts");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(cipherText),
    decipher.final(),
  ]).toString("utf8");
}

function selfTestTokenCrypto() {
  const sample = "token-crypto-self-test";
  const encrypted = encryptToken(sample);

  return decryptToken(encrypted) === sample;
}

module.exports = {
  decryptToken,
  encryptToken,
  selfTestTokenCrypto,
};
