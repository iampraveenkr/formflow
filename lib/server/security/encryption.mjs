import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";

function getEncryptionKey() {
  const value = process.env.TOKEN_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32-byte base64 value");
  }
  return key;
}

export function encryptSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = createDecipheriv(ALGO, getEncryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]);
  return decrypted.toString("utf8");
}
