export type GoogleConnectionStatus = "active" | "expired" | "revoked";

export interface ConnectedGoogleAccount {
  id: string;
  workspaceId: string;
  userId: string;
  googleEmail: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string;
  tokenExpiry: string;
  scopes: string[];
  status: GoogleConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "error" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedGoogleAccountPublic {
  id: string;
  googleEmail: string;
  tokenExpiry: string;
  scopes: string[];
  status: GoogleConnectionStatus;
  lastSyncAt: string | null;
  lastSyncStatus: "success" | "error" | null;
}
