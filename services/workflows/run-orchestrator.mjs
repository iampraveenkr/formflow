import {
  createTriggerEvent,
  createWorkflowRun,
  createWorkflowRunLog,
  createWorkflowRunStep,
  enqueueRunRetry,
  getWorkflowRun,
  getWorkflowRunStep,
  listWorkflowRunLogs,
  listWorkflowRunSteps,
  updateRetryQueueItem,
  updateWorkflowRun,
  updateWorkflowRunStep
} from "../../lib/server/db/formflow-repo.mjs";
import { evaluateWorkflowConditions, summarizeCondition } from "./engine.mjs";
import { executeWorkflowActions } from "./executor.mjs";
import { randomUUID } from "node:crypto";

export async function processWorkflowTrigger({ workspaceId, workflow, source, submission, externalEventId, idempotencyKey, stopOnFailure = true }) {
  if (!idempotencyKey) throw new Error("idempotencyKey is required");

  const triggerEvent = await createTriggerEvent({
    id: `evt_${randomUUID()}`,
    workspaceId,
    workflowId: workflow.id,
    idempotencyKey,
    externalEventId: externalEventId ?? null,
    source,
    payload: submission,
    createdAt: new Date().toISOString()
  });

  const runRequestId = `run_${randomUUID()}`;
  const run = await createWorkflowRun({
    id: runRequestId,
    triggerEventId: triggerEvent.id,
    workspaceId,
    workflowId: workflow.id,
    idempotencyKey,
    status: "queued",
    inputPayload: submission,
    outputPayload: null,
    errorSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  if (run.id !== runRequestId) {
    return {
      idempotentReplay: true,
      triggerEvent,
      run,
      steps: await listWorkflowRunSteps(run.id),
      logs: await listWorkflowRunLogs(run.id)
    };
  }

  await updateWorkflowRun(run.id, { status: "running" });
  await createWorkflowRunLog({
    id: `log_${randomUUID()}`,
    runId: run.id,
    stepId: null,
    level: "info",
    message: "workflow.run.started",
    metadata: { workflowId: workflow.id, source },
    createdAt: new Date().toISOString()
  });

  const conditionsPassed = evaluateWorkflowConditions(workflow.conditionMode, workflow.conditions, submission);
  if (!conditionsPassed) {
    await updateWorkflowRun(run.id, {
      status: "skipped",
      outputPayload: { conditionMode: workflow.conditionMode, summaries: workflow.conditions.map((condition) => summarizeCondition(condition)) },
      errorSummary: "Conditions not met."
    });

    await createWorkflowRunLog({
      id: `log_${randomUUID()}`,
      runId: run.id,
      stepId: null,
      level: "info",
      message: "workflow.run.skipped.conditions",
      metadata: null,
      createdAt: new Date().toISOString()
    });

    return { idempotentReplay: false, triggerEvent, run: (await getWorkflowRun(run.id)) ?? run, steps: [], logs: await listWorkflowRunLogs(run.id) };
  }

  const stepIdByOrder = new Map();
  const { hasFailure, results } = await executeWorkflowActions({
    actions: [...workflow.actions],
    submission,
    context: { workspaceId, workflowId: workflow.id, runId: run.id, provider: { googleConnected: true } },
    stopOnFailure,
    onStepStart: async ({ action, stepOrder }) => {
      const stepId = `step_${randomUUID()}`;
      stepIdByOrder.set(stepOrder, stepId);

      const step = await createWorkflowRunStep({
        id: stepId,
        runId: run.id,
        workflowId: workflow.id,
        actionType: String(action.actionType ?? "unknown"),
        stepOrder,
        status: "running",
        retryable: false,
        attemptCount: 1,
        inputPayload: action,
        outputPayload: null,
        errorSummary: null,
        startedAt: new Date().toISOString(),
        completedAt: null
      });

      await createWorkflowRunLog({
        id: `log_${randomUUID()}`,
        runId: run.id,
        stepId: step.id,
        level: "info",
        message: "workflow.step.started",
        metadata: { actionType: step.actionType, stepOrder },
        createdAt: new Date().toISOString()
      });
    },
    onStepResult: async ({ stepOrder, result }) => {
      const stepId = stepIdByOrder.get(stepOrder);
      if (!stepId) return;
      const failed = result.status !== "success";

      await updateWorkflowRunStep(stepId, {
        status: failed ? "failed" : "success",
        retryable: result.retryable,
        outputPayload: result.details,
        errorSummary: failed ? result.code ?? "Action failed" : null,
        completedAt: new Date().toISOString()
      });

      await createWorkflowRunLog({
        id: `log_${randomUUID()}`,
        runId: run.id,
        stepId,
        level: failed ? "error" : "info",
        message: failed ? "workflow.step.failed" : "workflow.step.succeeded",
        metadata: { code: result.code, retryable: result.retryable, details: result.details },
        createdAt: new Date().toISOString()
      });
    }
  });

  const failures = results.filter((result) => result.status !== "success").length;
  const successes = results.filter((result) => result.status === "success").length;

  let finalStatus = "success";
  if (hasFailure && successes > 0) finalStatus = "partial_success";
  else if (hasFailure) finalStatus = "failed";

  await updateWorkflowRun(run.id, {
    status: finalStatus,
    outputPayload: { conditionsPassed, results },
    errorSummary: hasFailure ? "One or more actions failed." : null
  });

  if (hasFailure) {
    const failedSteps = (await listWorkflowRunSteps(run.id)).filter((step) => step.status === "failed");
    for (const step of failedSteps) {
      if (!step.retryable) continue;
      await enqueueRunRetry({
        id: `retry_${randomUUID()}`,
        workspaceId,
        runId: run.id,
        stepId: step.id,
        status: "queued",
        attempt: 0,
        maxAttempts: 3,
        lastError: step.errorSummary,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  await createWorkflowRunLog({
    id: `log_${randomUUID()}`,
    runId: run.id,
    stepId: null,
    level: hasFailure ? "warn" : "info",
    message: hasFailure ? "workflow.run.completed_with_failures" : "workflow.run.completed",
    metadata: { status: finalStatus },
    createdAt: new Date().toISOString()
  });

  return {
    idempotentReplay: false,
    triggerEvent,
    run: (await getWorkflowRun(run.id)) ?? run,
    steps: await listWorkflowRunSteps(run.id),
    logs: await listWorkflowRunLogs(run.id)
  };
}

export async function retryWorkflowRun({ workspaceId, run, workflow, submissionOverride }) {
  return processWorkflowTrigger({
    workspaceId,
    workflow,
    source: "manual_retry",
    submission: submissionOverride ?? run.inputPayload,
    externalEventId: null,
    idempotencyKey: `${run.idempotencyKey}:retry:${Date.now()}`,
    stopOnFailure: true
  });
}

export async function retryWorkflowStep({ workspaceId, workflow, run, step, submission }) {
  await updateWorkflowRunStep(step.id, {
    status: "retrying",
    attemptCount: (step.attemptCount ?? 1) + 1,
    startedAt: new Date().toISOString(),
    completedAt: null
  });

  await createWorkflowRunLog({
    id: `log_${randomUUID()}`,
    runId: run.id,
    stepId: step.id,
    level: "info",
    message: "workflow.step.retry.started",
    metadata: { actionType: step.actionType },
    createdAt: new Date().toISOString()
  });

  const action = workflow.actions.find((item) => String(item.actionType) === step.actionType && (item.step_order ?? 0) === step.stepOrder) ?? step.inputPayload;
  const { results } = await executeWorkflowActions({
    actions: [action],
    submission,
    context: { workspaceId, workflowId: workflow.id, runId: run.id, provider: { googleConnected: true } },
    stopOnFailure: true
  });
  const result = results[0];

  const failed = result.status !== "success";
  await updateWorkflowRunStep(step.id, {
    status: failed ? "failed" : "success",
    retryable: result.retryable,
    outputPayload: result.details,
    errorSummary: failed ? result.code ?? "Action failed" : null,
    completedAt: new Date().toISOString()
  });

  await createWorkflowRunLog({
    id: `log_${randomUUID()}`,
    runId: run.id,
    stepId: step.id,
    level: failed ? "error" : "info",
    message: failed ? "workflow.step.retry.failed" : "workflow.step.retry.succeeded",
    metadata: { code: result.code, retryable: result.retryable },
    createdAt: new Date().toISOString()
  });

  if (!failed) {
    const steps = await listWorkflowRunSteps(run.id);
    const anyFailed = steps.some((row) => row.status === "failed");
    const anySuccess = steps.some((row) => row.status === "success");
    const nextStatus = anyFailed ? (anySuccess ? "partial_success" : "failed") : "success";
    await updateWorkflowRun(run.id, { status: nextStatus, errorSummary: anyFailed ? "Some steps still failing." : null });
  }

  return {
    run: await getWorkflowRun(run.id),
    step: await getWorkflowRunStep(step.id),
    logs: await listWorkflowRunLogs(run.id)
  };
}

export async function processRetryQueueItem(item, { workspaceId, workflow, run, step, submission }) {
  await updateRetryQueueItem(item.id, { status: "running", updatedAt: new Date().toISOString() });
  try {
    const result = await retryWorkflowStep({ workspaceId, workflow, run, step, submission });
    await updateRetryQueueItem(item.id, { status: "completed", updatedAt: new Date().toISOString(), lastError: null });
    return result;
  } catch (error) {
    const attempt = item.attempt + 1;
    const deadLetter = attempt >= item.maxAttempts;
    await updateRetryQueueItem(item.id, {
      attempt,
      status: deadLetter ? "dead_letter" : "failed",
      updatedAt: new Date().toISOString(),
      lastError: error instanceof Error ? error.message : "Unknown retry failure"
    });
    throw error;
  }
}
