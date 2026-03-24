import { getPlan, getSubscription, getUsage, incrementRunUsage, listPlans, monthKey } from "../../lib/server/db/billing/repo.mjs";

function withinGrace(subscription) {
  if (!subscription.graceUntil) return false;
  return new Date(subscription.graceUntil).getTime() >= Date.now();
}

export async function resolveWorkspacePlan(workspaceId) {
  const subscription = await getSubscription(workspaceId);
  let plan = await getPlan(subscription.planId);
  if (!plan) plan = await getPlan("free");

  const expired = subscription.status === "expired" && !withinGrace(subscription);
  if (expired) {
    const freePlan = await getPlan("free");
    return { subscription: { ...subscription, effectivePlanId: "free" }, plan: freePlan };
  }

  return { subscription: { ...subscription, effectivePlanId: plan.id }, plan };
}

export async function getBillingSummary(workspaceId, counters) {
  const { subscription, plan } = await resolveWorkspacePlan(workspaceId);
  const usage = await getUsage(workspaceId, monthKey());
  return {
    plan,
    subscription,
    usage: {
      monthKey: usage.monthKey,
      runs: usage.runs,
      workflows: counters.workflows,
      connectedAccounts: counters.connectedAccounts
    },
    plans: await listPlans()
  };
}

export async function enforceWorkflowCreateLimit(workspaceId, workflowCount) {
  const { plan } = await resolveWorkspacePlan(workspaceId);
  if (workflowCount >= plan.maxWorkflows) {
    return { allowed: false, reason: `Plan limit reached: ${plan.maxWorkflows} workflows on ${plan.name}.` };
  }
  return { allowed: true, reason: null };
}

export async function enforceAccountConnectionLimit(workspaceId, connectedAccounts) {
  const { plan } = await resolveWorkspacePlan(workspaceId);
  if (connectedAccounts >= plan.maxConnectedAccounts) {
    return { allowed: false, reason: `Plan limit reached: ${plan.maxConnectedAccounts} connected accounts on ${plan.name}.` };
  }
  return { allowed: true, reason: null };
}

export async function enforceActionAvailability(workspaceId, actions) {
  const { plan } = await resolveWorkspacePlan(workspaceId);
  const disallowed = actions
    .map((action) => String(action.actionType))
    .filter((actionType) => !plan.availableActions.includes(actionType));

  if (disallowed.length > 0) {
    return { allowed: false, reason: `Your ${plan.name} plan does not include: ${Array.from(new Set(disallowed)).join(", ")}.` };
  }

  return { allowed: true, reason: null };
}

export async function enforceRunLimit(workspaceId) {
  const { plan, subscription } = await resolveWorkspacePlan(workspaceId);
  const usage = await getUsage(workspaceId, monthKey());

  if (usage.runs >= plan.maxRunsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly run limit reached (${plan.maxRunsPerMonth}) for ${plan.name}. Upgrade to continue running workflows.`,
      plan,
      subscription,
      usage
    };
  }

  return { allowed: true, reason: null, plan, subscription, usage };
}

export async function recordRunUsage(workspaceId) {
  return incrementRunUsage(workspaceId, 1, monthKey());
}

export async function hasAdvancedLogsAccess(workspaceId) {
  const { plan } = await resolveWorkspacePlan(workspaceId);
  return plan.accessToAdvancedLogs;
}
