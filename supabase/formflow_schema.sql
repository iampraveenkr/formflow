-- FormFlow single-file schema bootstrap for Supabase/Postgres
-- Includes all core tables, constraints, indexes, and updated_at triggers.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  slug text not null unique,
  business_name text,
  owner_user_id text not null references public.users(id) on delete restrict,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending', 'complete')),
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  invited_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create unique index if not exists workspace_members_single_owner_idx
  on public.workspace_members(workspace_id)
  where role = 'owner';

create table if not exists public.connected_google_accounts (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  google_email text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expiry timestamptz not null,
  scopes text[] not null default '{}',
  status text not null check (status in ('active', 'expired', 'revoked')),
  last_sync_time timestamptz,
  last_sync_status text check (last_sync_status in ('success', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, google_email)
);

create table if not exists public.forms (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  connected_google_account_id text references public.connected_google_accounts(id) on delete set null,
  google_form_id text not null,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  schema_json jsonb not null default '{}'::jsonb,
  schema_version_hash text,
  last_synced_at timestamptz,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, google_form_id)
);

create table if not exists public.form_fields (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  form_id text not null references public.forms(id) on delete cascade,
  external_field_id text not null,
  label text not null,
  field_type text not null,
  is_required boolean not null default false,
  options jsonb,
  internal_field_key text not null,
  is_supported boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (form_id, external_field_id)
);

create table if not exists public.workflows (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  form_id text references public.forms(id) on delete set null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  trigger_type text not null default 'form_submission',
  trigger_config jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_conditions (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_id text not null references public.workflows(id) on delete cascade,
  condition_type text not null,
  operator text,
  field_key text,
  value jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_actions (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_id text not null references public.workflows(id) on delete cascade,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trigger_events (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_id text references public.workflows(id) on delete set null,
  source text not null,
  external_event_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (workspace_id, source, external_event_id)
);

create table if not exists public.workflow_runs (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_id text not null references public.workflows(id) on delete cascade,
  trigger_event_id text references public.trigger_events(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed', 'cancelled')),
  idempotency_key text,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error_summary text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table if not exists public.workflow_run_steps (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_run_id text not null references public.workflow_runs(id) on delete cascade,
  workflow_action_id text references public.workflow_actions(id) on delete set null,
  step_index integer not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed', 'skipped')),
  attempt_count integer not null default 0,
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_run_id, step_index)
);

create table if not exists public.workflow_run_logs (
  id bigserial primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  workflow_run_id text not null references public.workflow_runs(id) on delete cascade,
  step_id text references public.workflow_run_steps(id) on delete set null,
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id text primary key,
  workspace_id text references public.workspaces(id) on delete cascade,
  name text not null,
  template_type text not null,
  body jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id text references public.users(id) on delete set null,
  notification_type text not null,
  channel text not null check (channel in ('email', 'slack', 'in_app', 'webhook')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'read')),
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  provider text not null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'error')),
  config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text check (last_sync_status in ('success', 'error')),
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, name)
);

create table if not exists public.billing_plans (
  id text primary key,
  code text not null unique,
  name text not null,
  description text,
  price_cents integer not null,
  currency text not null default 'USD',
  interval text not null check (interval in ('month', 'year')),
  is_active boolean not null default true,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  billing_plan_id text not null references public.billing_plans(id) on delete restrict,
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id)
);

create table if not exists public.api_keys (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  created_by text references public.users(id) on delete set null,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id text primary key,
  workspace_id text references public.workspaces(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null default false,
  value jsonb,
  updated_by text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, flag_key)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists connected_google_accounts_workspace_idx on public.connected_google_accounts(workspace_id);
create index if not exists forms_workspace_idx on public.forms(workspace_id);
create index if not exists form_fields_form_idx on public.form_fields(form_id);
create index if not exists workflows_workspace_status_idx on public.workflows(workspace_id, status);
create index if not exists workflow_conditions_workflow_idx on public.workflow_conditions(workflow_id, position);
create index if not exists workflow_actions_workflow_idx on public.workflow_actions(workflow_id, position);
create index if not exists trigger_events_workspace_received_idx on public.trigger_events(workspace_id, received_at desc);
create index if not exists workflow_runs_workspace_created_idx on public.workflow_runs(workspace_id, created_at desc);
create index if not exists workflow_runs_status_idx on public.workflow_runs(status);
create index if not exists workflow_run_steps_run_idx on public.workflow_run_steps(workflow_run_id, step_index);
create index if not exists workflow_run_logs_run_created_idx on public.workflow_run_logs(workflow_run_id, created_at);
create index if not exists templates_workspace_idx on public.templates(workspace_id);
create index if not exists notifications_workspace_status_idx on public.notifications(workspace_id, status);
create index if not exists integrations_workspace_provider_idx on public.integrations(workspace_id, provider);
create index if not exists subscriptions_workspace_idx on public.subscriptions(workspace_id);
create index if not exists api_keys_workspace_idx on public.api_keys(workspace_id);
create index if not exists feature_flags_workspace_idx on public.feature_flags(workspace_id);

create or replace trigger trg_users_updated_at before update on public.users for each row execute function public.set_updated_at();
create or replace trigger trg_workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create or replace trigger trg_workspace_members_updated_at before update on public.workspace_members for each row execute function public.set_updated_at();
create or replace trigger trg_connected_google_accounts_updated_at before update on public.connected_google_accounts for each row execute function public.set_updated_at();
create or replace trigger trg_forms_updated_at before update on public.forms for each row execute function public.set_updated_at();
create or replace trigger trg_form_fields_updated_at before update on public.form_fields for each row execute function public.set_updated_at();
create or replace trigger trg_workflows_updated_at before update on public.workflows for each row execute function public.set_updated_at();
create or replace trigger trg_workflow_conditions_updated_at before update on public.workflow_conditions for each row execute function public.set_updated_at();
create or replace trigger trg_workflow_actions_updated_at before update on public.workflow_actions for each row execute function public.set_updated_at();
create or replace trigger trg_workflow_runs_updated_at before update on public.workflow_runs for each row execute function public.set_updated_at();
create or replace trigger trg_workflow_run_steps_updated_at before update on public.workflow_run_steps for each row execute function public.set_updated_at();
create or replace trigger trg_templates_updated_at before update on public.templates for each row execute function public.set_updated_at();
create or replace trigger trg_notifications_updated_at before update on public.notifications for each row execute function public.set_updated_at();
create or replace trigger trg_integrations_updated_at before update on public.integrations for each row execute function public.set_updated_at();
create or replace trigger trg_billing_plans_updated_at before update on public.billing_plans for each row execute function public.set_updated_at();
create or replace trigger trg_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create or replace trigger trg_api_keys_updated_at before update on public.api_keys for each row execute function public.set_updated_at();
create or replace trigger trg_feature_flags_updated_at before update on public.feature_flags for each row execute function public.set_updated_at();
