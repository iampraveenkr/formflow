import { randomUUID } from "node:crypto";
import { encryptSecret, decryptSecret } from "@/lib/server/security/encryption";
import { upsertGoogleAccount, findGoogleAccountById, updateGoogleAccountSync } from "@/lib/server/integrations/google-connections-repo";
import { applyRefreshFailureStatus } from "@/lib/server/integrations/refresh-status";
import type { ConnectedGoogleAccount, ConnectedGoogleAccountPublic } from "@/types/google-connection";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const DEFAULT_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/calendar.events"
];

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function isoPlusSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function buildGoogleConnectionOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: env("GOOGLE_CONNECT_REDIRECT_URI"),
    response_type: "code",
    scope: DEFAULT_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

interface GoogleProfile {
  email: string;
}

export async function exchangeOAuthCodeForGoogleConnection(input: {
  code: string;
  workspaceId: string;
  userId: string;
}): Promise<ConnectedGoogleAccount> {
  if (process.env.GOOGLE_MOCK_MODE === "true") {
    return {
      id: `gca_${randomUUID()}`,
      workspaceId: input.workspaceId,
      userId: input.userId,
      googleEmail: process.env.GOOGLE_MOCK_EMAIL ?? "mock-google@example.com",
      accessTokenEncrypted: encryptSecret("mock_access_token"),
      refreshTokenEncrypted: encryptSecret("mock_refresh_token"),
      tokenExpiry: isoPlusSeconds(3600),
      scopes: DEFAULT_SCOPES,
      status: "active",
      lastSyncAt: null,
      lastSyncStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: env("GOOGLE_CONNECT_REDIRECT_URI"),
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    throw new Error("Token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenData.access_token) {
    throw new Error("Missing access token");
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!profileResponse.ok) {
    throw new Error("Unable to load Google profile");
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  const now = new Date().toISOString();

  return {
    id: `gca_${randomUUID()}`,
    workspaceId: input.workspaceId,
    userId: input.userId,
    googleEmail: profile.email,
    accessTokenEncrypted: encryptSecret(tokenData.access_token),
    refreshTokenEncrypted: encryptSecret(tokenData.refresh_token ?? ""),
    tokenExpiry: isoPlusSeconds(tokenData.expires_in),
    scopes: tokenData.scope ? tokenData.scope.split(" ") : DEFAULT_SCOPES,
    status: "active",
    lastSyncAt: null,
    lastSyncStatus: null,
    createdAt: now,
    updatedAt: now
  };
}

export function toPublicGoogleAccount(account: ConnectedGoogleAccount): ConnectedGoogleAccountPublic {
  return {
    id: account.id,
    googleEmail: account.googleEmail,
    tokenExpiry: account.tokenExpiry,
    scopes: account.scopes,
    status: account.status,
    lastSyncAt: account.lastSyncAt,
    lastSyncStatus: account.lastSyncStatus
  };
}

export async function refreshGoogleAccessToken(accountId: string): Promise<void> {
  const account = await findGoogleAccountById(accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  try {
    if (process.env.GOOGLE_MOCK_MODE === "true") {
      account.accessTokenEncrypted = encryptSecret("mock_refreshed_access_token");
      account.tokenExpiry = isoPlusSeconds(3600);
      account.status = "active";
      account.updatedAt = new Date().toISOString();
      await upsertGoogleAccount(account);
      await updateGoogleAccountSync(accountId, { status: "success", at: new Date().toISOString() });
      return;
    }

    const refreshToken = decryptSecret(account.refreshTokenEncrypted);
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env("GOOGLE_CLIENT_ID"),
        client_secret: env("GOOGLE_CLIENT_SECRET"),
        refresh_token: refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      await applyRefreshFailureStatus(account.id);
      return;
    }

    const tokenData = (await response.json()) as GoogleTokenResponse;
    account.accessTokenEncrypted = encryptSecret(tokenData.access_token);
    account.tokenExpiry = isoPlusSeconds(tokenData.expires_in);
    account.status = "active";
    account.updatedAt = new Date().toISOString();
    await upsertGoogleAccount(account);
    await updateGoogleAccountSync(account.id, { status: "success", at: new Date().toISOString() });
  } catch {
    await applyRefreshFailureStatus(account.id);
  }
}
