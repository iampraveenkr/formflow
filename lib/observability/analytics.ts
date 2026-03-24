export interface AnalyticsEvent {
  event: string;
  workspaceId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
}

export function trackEvent(input: AnalyticsEvent): void {
  const payload = {
    ...input,
    occurredAt: new Date().toISOString()
  };

  // Placeholder hook for future GA4/Segment/PostHog integration.
  console.info("[formflow:analytics]", JSON.stringify(payload));
}
