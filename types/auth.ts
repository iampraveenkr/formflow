export interface SessionPayload {
  userId: string;
  email: string;
  workspaceId: string | null;
  onboardingComplete: boolean;
  issuedAt: number;
  expiresAt: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  onboardingStatus: "pending" | "complete";
}

export interface WorkspaceMemberRecord {
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}
