import type { AuthenticatedUser, WorkspaceMemberRecord, WorkspaceRecord } from "@/types/auth";

// Safe scaffold default: this repository uses in-memory fallbacks for local development.
// Replace with Supabase-backed implementation when environment credentials are configured.
const users = new Map<string, AuthenticatedUser>();
const workspaces = new Map<string, WorkspaceRecord>();
const members: WorkspaceMemberRecord[] = [];

function makeWorkspaceSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export async function findUserByEmail(email: string): Promise<AuthenticatedUser | null> {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

export async function upsertUser(user: AuthenticatedUser): Promise<AuthenticatedUser> {
  users.set(user.id, user);
  return user;
}

export async function listMembershipsByUserId(userId: string): Promise<WorkspaceMemberRecord[]> {
  return members.filter((membership) => membership.userId === userId);
}

export async function getWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | null> {
  return workspaces.get(workspaceId) ?? null;
}

export async function createWorkspaceForOwner(input: {
  name: string;
  ownerUserId: string;
  onboardingStatus: "pending" | "complete";
}): Promise<WorkspaceRecord> {
  const workspace: WorkspaceRecord = {
    id: `ws_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    slug: makeWorkspaceSlug(input.name),
    ownerUserId: input.ownerUserId,
    onboardingStatus: input.onboardingStatus
  };
  workspaces.set(workspace.id, workspace);
  return workspace;
}

export async function ensureOwnerMembership(workspaceId: string, userId: string): Promise<void> {
  const existing = members.find((membership) => membership.workspaceId === workspaceId && membership.userId === userId);
  if (!existing) {
    members.push({ workspaceId, userId, role: "owner" });
  }
}

export async function updateWorkspaceOnboardingStatus(workspaceId: string, status: "pending" | "complete"): Promise<void> {
  const workspace = workspaces.get(workspaceId);
  if (!workspace) {
    return;
  }
  workspace.onboardingStatus = status;
  workspaces.set(workspaceId, workspace);
}
