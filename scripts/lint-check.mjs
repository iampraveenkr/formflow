import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = [
  "services/auth/guards.mjs",
  "services/workspace/bootstrap.mjs",
  "lib/server/auth/session.ts",
  "app/(public)/onboarding/page.tsx"
];

for (const filePath of files) {
  const content = await readFile(filePath, "utf8");
  assert.ok(!content.includes("TODO"), `${filePath} still contains TODO markers`);
  assert.ok(content.trim().length > 0, `${filePath} is empty`);
}

console.log("Lint check passed: critical files are non-empty and TODO-free.");
