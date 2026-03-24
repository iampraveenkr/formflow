import test from "node:test";
import assert from "node:assert/strict";
import { decideBootstrapActions } from "../../services/workspace/bootstrap.mjs";

test("new user triggers profile/workspace/membership creation", () => {
  const result = decideBootstrapActions({
    user: { id: "u1", email: "new@example.com", fullName: "New User", avatarUrl: null },
    existingWorkspace: null,
    existingMemberships: []
  });

  assert.deepEqual(result, {
    createProfile: true,
    createWorkspace: true,
    createOwnerMembership: true,
    onboardingComplete: false
  });
});

test("existing onboarded workspace does not recreate records", () => {
  const result = decideBootstrapActions({
    user: { id: "u1", email: "exists@example.com", fullName: "Existing User", avatarUrl: null },
    existingWorkspace: {
      id: "ws_1",
      name: "Existing",
      slug: "existing",
      ownerUserId: "u1",
      onboardingStatus: "complete"
    },
    existingMemberships: [{ workspaceId: "ws_1", userId: "u1", role: "owner" }]
  });

  assert.deepEqual(result, {
    createProfile: false,
    createWorkspace: false,
    createOwnerMembership: false,
    onboardingComplete: true
  });
});
