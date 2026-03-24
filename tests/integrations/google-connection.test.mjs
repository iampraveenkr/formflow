import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret, decryptSecret } from "../../lib/server/security/encryption.mjs";
import {
  clearGoogleAccountStore,
  upsertGoogleAccount,
  listGoogleAccountsByWorkspace,
  removeGoogleAccount,
  findGoogleAccountById
} from "../../lib/server/integrations/google-connections-repo.mjs";
import { isOAuthStateValid } from "../../services/integrations/state.mjs";
import { applyRefreshFailureStatus } from "../../lib/server/integrations/refresh-status.mjs";

process.env.TOKEN_ENCRYPTION_KEY = Buffer.from("12345678901234567890123456789012").toString("base64");

test("OAuth state validation rejects mismatched states", () => {
  assert.equal(isOAuthStateValid("abc", "xyz"), false);
  assert.equal(isOAuthStateValid("abc", "abc"), true);
});

test("token encryption and decryption roundtrip", () => {
  const encrypted = encryptSecret("super_secret_token");
  const decrypted = decryptSecret(encrypted);
  assert.equal(decrypted, "super_secret_token");
});

test("disconnect flow removes account", async () => {
  clearGoogleAccountStore();

  await upsertGoogleAccount({
    id: "gca_1",
    workspaceId: "ws_1",
    userId: "u_1",
    googleEmail: "a@example.com",
    accessTokenEncrypted: "x",
    refreshTokenEncrypted: "y",
    tokenExpiry: new Date().toISOString(),
    scopes: ["openid"],
    status: "active",
    lastSyncAt: null,
    lastSyncStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await removeGoogleAccount("gca_1");
  const accounts = await listGoogleAccountsByWorkspace("ws_1");
  assert.equal(accounts.length, 0);
});

test("status changes to revoked on refresh failure path", async () => {
  clearGoogleAccountStore();

  await upsertGoogleAccount({
    id: "gca_2",
    workspaceId: "ws_1",
    userId: "u_1",
    googleEmail: "b@example.com",
    accessTokenEncrypted: "x",
    refreshTokenEncrypted: "y",
    tokenExpiry: new Date().toISOString(),
    scopes: ["openid"],
    status: "active",
    lastSyncAt: null,
    lastSyncStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  await applyRefreshFailureStatus("gca_2");
  const account = await findGoogleAccountById("gca_2");
  assert.equal(account?.status, "revoked");
  assert.equal(account?.lastSyncStatus, "error");
});
