# FormFlow Release Checklist (Marketplace Readiness)

- [ ] Privacy Policy final text published (`/privacy`)
- [ ] Terms of Service final text published (`/terms`)
- [ ] Support contact and SLA published (`/support`)
- [ ] OAuth consent screen configured and verified
- [ ] Marketplace listing copy finalized (`docs/marketplace-copy.md`)
- [ ] ADMIN_API_KEY configured for admin health endpoint
- [ ] SESSION_SECRET and token encryption keys rotated and documented
- [ ] Billing plans and limits validated in staging
- [ ] Error tracking backend connected (Sentry/Datadog/etc.)
- [ ] Analytics backend connected (GA4/PostHog/etc.)
- [ ] All tests pass (`npm test`, `npm run lint`, `npm run typecheck`)
- [ ] Demo seed command verified (`npm run seed:demo`)
- [ ] Validate workspace-scoped form mapping access control in staging
- [ ] Validate standardized API error contracts on auth failures (401/404/402)
- [ ] Smoke test onboarding input validation (trimmed values + max-length guardrails)
- [ ] Confirm log/retry endpoints emit observability events on failures
