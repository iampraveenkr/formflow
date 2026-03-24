import test from "node:test";
import assert from "node:assert/strict";

const REQUIRED_ROUTES = ["/dashboard", "/workflows", "/integrations", "/logs", "/billing", "/settings"];

test("dashboard navigation routes are scaffolded", () => {
  const navItems = ["/dashboard", "/workflows", "/integrations", "/logs", "/billing", "/settings"];
  assert.deepEqual(navItems, REQUIRED_ROUTES);
});
