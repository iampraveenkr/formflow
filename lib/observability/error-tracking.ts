export interface ErrorContext {
  area: string;
  action?: string;
  workspaceId?: string;
  route?: string;
  extra?: Record<string, unknown>;
}

export function trackError(error: unknown, context: ErrorContext): void {
  const payload = {
    level: "error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    occurredAt: new Date().toISOString()
  };

  // Placeholder hook for future Sentry/Datadog/Cloud Logging integration.
  console.error("[formflow:error]", JSON.stringify(payload));
}
