import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const requiredPaths = [
  "app/api/auth/google/start/route.ts",
  "app/api/auth/google/callback/route.ts",
  "app/api/auth/signout/route.ts",
  "app/api/onboarding/route.ts",
  "app/api/integrations/google/start/route.ts",
  "app/api/integrations/google/callback/route.ts",
  "app/api/integrations/google/accounts/route.ts",
  "app/api/integrations/google/disconnect/route.ts",
  "app/api/integrations/google/refresh/route.ts",
  "app/api/forms/google/route.ts",
  "app/api/forms/sync/route.ts",
  "app/api/forms/workflow/route.ts",
  "app/api/forms/map/route.ts",
  "app/api/forms/preview/route.ts",
  "middleware.ts",
  "supabase/migrations/202603240900_auth_onboarding.sql",
  "supabase/migrations/202603241000_google_connections.sql",
  "supabase/migrations/202603241100_full_schema.sql",
  "supabase/migrations/202603241200_form_sync_and_mapping.sql",
  "supabase/seed.sql",
  "docs/database-schema.md"
];

async function ensureFilesExist() {
  for (const path of requiredPaths) {
    const content = await readFile(path, "utf8");
    assert.ok(content.length > 0, `${path} should not be empty`);
  }
}

async function ensureMigrationIncludesCoreTables() {
  const sql = await readFile("supabase/migrations/202603240900_auth_onboarding.sql", "utf8");
  assert.match(sql, /create table if not exists public\.users/i);
  assert.match(sql, /create table if not exists public\.workspaces/i);
  assert.match(sql, /create table if not exists public\.workspace_members/i);

  const googleSql = await readFile("supabase/migrations/202603241000_google_connections.sql", "utf8");
  assert.match(googleSql, /create table if not exists public\.connected_google_accounts/i);

  const fullSchemaSql = await readFile("supabase/migrations/202603241100_full_schema.sql", "utf8");
  assert.match(fullSchemaSql, /create table if not exists public\.workflow_runs/i);
  assert.match(fullSchemaSql, /unique \(workspace_id, idempotency_key\)/i);
}

await ensureFilesExist();
await ensureMigrationIncludesCoreTables();
console.log("Build check passed: scaffold files and migration are present.");
