# FormFlow Architecture Blueprint

This document captures the initial product architecture and implementation plan before feature delivery.

## 1) Architecture

- **Frontend:** Next.js App Router with TypeScript + Tailwind.
- **Backend:** Next.js Route Handlers and Server Actions for internal APIs.
- **Data:** Supabase Postgres with SQL migrations under `supabase/migrations`.
- **Auth:** Google OAuth (implementation starts in milestone 2).
- **Tenancy model:** Workspace-first multi-tenant architecture.
- **Execution model:** Form submission events enqueue workflow runs; engine evaluates conditions then executes actions.
- **Reliability defaults:** At-least-once action execution with idempotency keys and retry metadata.

## 2) Folder Structure

```text
src/
  app/
    (marketing + dashboard UI)
    api/                 # API routes
  components/            # Reusable UI
  lib/                   # Shared utilities/env/clients
  server/                # Server-only domain logic
  types/                 # Explicit domain types
supabase/
  migrations/            # SQL migrations
tests/
  unit/                  # Critical logic tests
docs/
  blueprint.md
```

## 3) Planned Database Schema

- `workspaces` (tenant root)
- `users` (app profile)
- `workspace_memberships`
- `google_connections`
- `forms`
- `form_fields`
- `workflows`
- `workflow_conditions`
- `workflow_actions`
- `workflow_runs`
- `workflow_run_steps`
- `tasks`
- `billing_customers`
- `billing_subscriptions`

> Safe default: all workflow state changes are auditable through run + step tables.

## 4) Planned API Route List

- `GET /api/health`
- `POST /api/auth/google/start`
- `GET /api/auth/google/callback`
- `GET /api/workspaces`
- `POST /api/workspaces`
- `POST /api/google/connections`
- `GET /api/forms`
- `POST /api/forms/sync`
- `GET /api/workflows`
- `POST /api/workflows`
- `PATCH /api/workflows/:id`
- `POST /api/workflows/:id/test-run`
- `GET /api/workflow-runs`
- `POST /api/webhooks/form-submission`
- `GET /api/billing/portal`

## 5) Build Milestone Plan

1. Repository scaffold ✅
2. Auth and workspace setup
3. Google account connection
4. Database schema and migrations
5. Form sync and field mapping
6. Workflow CRUD
7. Condition engine
8. Action engine
9. Workflow run logging and retries
10. Dashboard pages
11. Billing scaffold
12. Tests and seed data
13. Hardening and cleanup

