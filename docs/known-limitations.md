# Known Limitations

- The current data layer uses in-memory repositories for local-first scaffolding; production persistence still requires full Supabase/Postgres wiring.
- Some UI/API contracts still use endpoint-specific response shapes for backward compatibility; a full v2 API contract unification is pending.
- OAuth and third-party integrations include placeholders and should be validated against production provider behavior before launch.
- No full end-to-end browser test suite is included yet (API/service-level tests are present).
- Observability hooks currently log to console and are prepared for wiring to external providers (Sentry/Datadog/GA4/PostHog).
