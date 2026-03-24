import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const requiredPaths = [
  "app/api/auth/google/start/route.ts",
  "app/api/auth/google/callback/route.ts",
  "app/api/auth/signout/route.ts",
  "app/api/onboarding/route.ts",
  "middleware.ts",
  "supabase/migrations/202603240900_auth_onboarding.sql"
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
}

await ensureFilesExist();
await ensureMigrationIncludesCoreTables();
console.log("Build check passed: scaffold files and migration are present.");
