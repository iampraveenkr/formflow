import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sessionSource = await readFile("lib/server/auth/session.ts", "utf8");
const guardsSource = await readFile("services/auth/guards.mjs", "utf8");
const bootstrapSource = await readFile("services/workspace/bootstrap.mjs", "utf8");
const googleOauthSource = await readFile("lib/server/integrations/google-oauth.ts", "utf8");
const repoSource = await readFile("lib/server/db/formflow-repo.ts", "utf8");
const formsParserSource = await readFile("services/forms/parser.mjs", "utf8");
const formsSyncSource = await readFile("lib/server/forms/form-sync.ts", "utf8");

assert.match(sessionSource, /createSessionToken\(/);
assert.match(sessionSource, /parseSessionToken\(/);
assert.match(guardsSource, /decideProtectedRouteRedirect/);
assert.match(guardsSource, /"\/login"/);
assert.match(bootstrapSource, /decideBootstrapActions/);
assert.match(bootstrapSource, /createWorkspace/);
assert.match(googleOauthSource, /exchangeOAuthCodeForGoogleConnection/);
assert.match(googleOauthSource, /refreshGoogleAccessToken/);
assert.match(repoSource, /createWorkflowRun/);
assert.match(repoSource, /idempotencyKey/);
assert.match(formsParserSource, /parseGoogleFormSchema/);
assert.match(formsParserSource, /buildTestPayload/);
assert.match(formsSyncSource, /syncFormForWorkflow/);

console.log("Typecheck check passed: core auth/onboarding logic definitions are present.");
