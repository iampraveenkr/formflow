import test from "node:test";
import assert from "node:assert/strict";
import { decideAuthPageRedirect, decideProtectedRouteRedirect } from "../../services/auth/guards.mjs";

test("redirect unauthenticated users from protected pages to /login", () => {
  const decision = decideProtectedRouteRedirect("/dashboard", null);
  assert.equal(decision.allow, false);
  assert.equal(decision.redirectTo, "/login");
});

test("redirect authenticated users without onboarding to /onboarding", () => {
  const decision = decideProtectedRouteRedirect("/dashboard", {
    userId: "u1",
    email: "a@example.com",
    workspaceId: "ws_1",
    onboardingComplete: false,
    issuedAt: 1,
    expiresAt: 9999999999
  });

  assert.equal(decision.allow, false);
  assert.equal(decision.redirectTo, "/onboarding");
});

test("redirect logged-in user away from /login", () => {
  const decision = decideAuthPageRedirect("/login", {
    userId: "u1",
    email: "a@example.com",
    workspaceId: "ws_1",
    onboardingComplete: true,
    issuedAt: 1,
    expiresAt: 9999999999
  });

  assert.equal(decision.allow, false);
  assert.equal(decision.redirectTo, "/dashboard");
});
