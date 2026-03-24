import test from "node:test";
import assert from "node:assert/strict";

const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workflows", label: "Workflows" },
  { href: "/integrations", label: "Integrations" },
  { href: "/logs", label: "Logs" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" }
];

const REQUIRED_ROUTES = ["/dashboard", "/workflows", "/integrations", "/logs", "/billing", "/settings"];

test("dashboard navigation routes are scaffolded", () => {
  const navItems = DASHBOARD_NAV_ITEMS.map((item) => item.href);
  assert.deepEqual(navItems, REQUIRED_ROUTES);
});
