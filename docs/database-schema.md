# FormFlow Database Schema

This document describes the Supabase/Postgres schema defined in:
- `supabase/migrations/202603241100_full_schema.sql`
- `supabase/seed.sql`

## Design highlights

- Multi-tenant by `workspace_id` on tenant-owned tables.
- `timestamptz` used for all timestamps.
- `jsonb` used for structured payload/config fields.
- Idempotency support on `workflow_runs(workspace_id, idempotency_key)`.
- Audit-friendly fields: `created_at`, `updated_at`, and creator/owner references where appropriate.

## Tables

1. `users`
2. `workspaces`
3. `workspace_members`
4. `connected_google_accounts`
5. `forms`
6. `form_fields`
7. `workflows`
8. `workflow_conditions`
9. `workflow_actions`
10. `trigger_events`
11. `workflow_runs`
12. `workflow_run_steps`
13. `workflow_run_logs`
14. `templates`
15. `notifications`
16. `integrations`
17. `billing_plans`
18. `subscriptions`
19. `api_keys`
20. `feature_flags`

## Seed data

`supabase/seed.sql` includes:
- billing plans (`free`, `pro`, `enterprise`)
- demo owner user + demo workspace
- demo membership
- demo form + workflow + workflow action
- sample template
- feature flags
- demo subscription

## Migration safety

- Uses `create table if not exists` and `create index if not exists` for safe bootstrap.
- Uses trigger function `set_updated_at` and update triggers on mutable tables.
