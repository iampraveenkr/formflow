import { executeAction } from "./actions.mjs";

export async function executeWorkflowActions({ actions, submission, context, stopOnFailure = true, onStepStart, onStepResult }) {
  const ordered = [...actions].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));
  let hasFailure = false;
  const results = [];

  for (let index = 0; index < ordered.length; index += 1) {
    const action = ordered[index];
    const stepOrder = action.step_order ?? index + 1;

    if (onStepStart) {
      await onStepStart({ action, stepOrder });
    }

    const result = await executeAction(action, { ...context, submission });
    results.push({ actionType: action.actionType, stepOrder, ...result });

    if (onStepResult) {
      await onStepResult({ action, stepOrder, result });
    }

    if (result.status !== "success") {
      hasFailure = true;
      if (stopOnFailure) break;
    }
  }

  return { hasFailure, results };
}
