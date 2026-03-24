import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sessionSource = await readFile("lib/server/auth/session.ts", "utf8");
const guardsSource = await readFile("services/auth/guards.mjs", "utf8");
const bootstrapSource = await readFile("services/workspace/bootstrap.mjs", "utf8");

assert.match(sessionSource, /createSessionToken\(/);
assert.match(sessionSource, /parseSessionToken\(/);
assert.match(guardsSource, /decideProtectedRouteRedirect/);
assert.match(guardsSource, /"\/login"/);
assert.match(bootstrapSource, /decideBootstrapActions/);
assert.match(bootstrapSource, /createWorkspace/);

console.log("Typecheck check passed: core auth/onboarding logic definitions are present.");
