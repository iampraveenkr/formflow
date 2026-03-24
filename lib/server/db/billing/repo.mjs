const plans = [
  {
    id: "free",
    name: "Free",
    maxWorkflows: 2,
    maxRunsPerMonth: 100,
    maxConnectedAccounts: 1,
    availableActions: ["send_email", "call_webhook"],
    accessToTemplates: false,
    accessToAdvancedLogs: false,
    supportLevel: "community"
  },
  {
    id: "starter",
    name: "Starter",
    maxWorkflows: 20,
    maxRunsPerMonth: 5000,
    maxConnectedAccounts: 3,
    availableActions: ["send_email", "call_webhook", "append_sheet_row", "send_slack_message", "create_internal_task"],
    accessToTemplates: true,
    accessToAdvancedLogs: true,
    supportLevel: "standard"
  },
  {
    id: "pro",
    name: "Pro",
    maxWorkflows: 100,
    maxRunsPerMonth: 50000,
    maxConnectedAccounts: 15,
    availableActions: ["send_email", "call_webhook", "append_sheet_row", "send_slack_message", "create_internal_task", "create_calendar_event", "create_google_doc", "export_pdf"],
    accessToTemplates: true,
    accessToAdvancedLogs: true,
    supportLevel: "priority"
  }
];

const subscriptions = new Map();
const usageByWorkspaceMonth = new Map();

function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function defaultSubscription(workspaceId) {
  return {
    workspaceId,
    planId: "free",
    status: "active",
    trialEndsAt: null,
    graceUntil: null,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: null,
    updatedAt: new Date().toISOString()
  };
}

export async function listPlans() {
  return plans;
}

export async function getPlan(planId) {
  return plans.find((plan) => plan.id === planId) ?? null;
}

export async function getSubscription(workspaceId) {
  if (!subscriptions.has(workspaceId)) subscriptions.set(workspaceId, defaultSubscription(workspaceId));
  return subscriptions.get(workspaceId);
}

export async function upsertSubscription(workspaceId, patch) {
  const current = await getSubscription(workspaceId);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  subscriptions.set(workspaceId, next);
  return next;
}

function keyFor(workspaceId, key) {
  return `${workspaceId}:${key}`;
}

export async function getUsage(workspaceId, key = monthKey()) {
  const keyValue = keyFor(workspaceId, key);
  if (!usageByWorkspaceMonth.has(keyValue)) {
    usageByWorkspaceMonth.set(keyValue, {
      workspaceId,
      monthKey: key,
      runs: 0,
      connectedAccounts: 0,
      updatedAt: new Date().toISOString()
    });
  }
  return usageByWorkspaceMonth.get(keyValue);
}

export async function incrementRunUsage(workspaceId, amount = 1, key = monthKey()) {
  const usage = await getUsage(workspaceId, key);
  usage.runs += amount;
  usage.updatedAt = new Date().toISOString();
  usageByWorkspaceMonth.set(keyFor(workspaceId, key), usage);
  return usage;
}

export { monthKey };
