-- Billing plans
insert into public.billing_plans (id, code, name, description, price_cents, currency, interval, features)
values
  ('plan_free', 'free', 'Free', 'Starter plan for testing', 0, 'USD', 'month', '{"workflow_limit": 100, "google_accounts": 1}'::jsonb),
  ('plan_pro', 'pro', 'Pro', 'Professional automation plan', 4900, 'USD', 'month', '{"workflow_limit": 5000, "google_accounts": 10}'::jsonb),
  ('plan_enterprise', 'enterprise', 'Enterprise', 'Enterprise automation plan', 19900, 'USD', 'month', '{"workflow_limit": 50000, "google_accounts": 100}'::jsonb)
on conflict (id) do update set
  code = excluded.code,
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  interval = excluded.interval,
  features = excluded.features;

-- Demo user/workspace
insert into public.users (id, email, full_name)
values ('user_demo_owner', 'owner@formflow.demo', 'Demo Owner')
on conflict (id) do nothing;

insert into public.workspaces (id, name, slug, business_name, owner_user_id, onboarding_status, created_by)
values ('ws_demo', 'Demo Workspace', 'demo-workspace', 'Demo Team', 'user_demo_owner', 'complete', 'user_demo_owner')
on conflict (id) do nothing;

insert into public.workspace_members (workspace_id, user_id, role, invited_by)
values ('ws_demo', 'user_demo_owner', 'owner', 'user_demo_owner')
on conflict (workspace_id, user_id) do nothing;

-- Demo form + workflow
insert into public.forms (id, workspace_id, google_form_id, title, status, created_by)
values ('form_demo', 'ws_demo', 'google_form_demo_1', 'Demo Intake Form', 'active', 'user_demo_owner')
on conflict (id) do nothing;

insert into public.workflows (id, workspace_id, form_id, name, status, trigger_type, trigger_config, is_demo, created_by)
values ('wf_demo', 'ws_demo', 'form_demo', 'Demo Workflow', 'active', 'form_submission', '{"source":"google_forms"}'::jsonb, true, 'user_demo_owner')
on conflict (id) do nothing;

insert into public.workflow_actions (id, workspace_id, workflow_id, action_type, action_config, position)
values ('wfa_demo_email', 'ws_demo', 'wf_demo', 'send_email', '{"to":"ops@formflow.demo","subject":"New response"}'::jsonb, 1)
on conflict (id) do nothing;

-- Sample template
insert into public.templates (id, workspace_id, name, template_type, body, is_system, created_by)
values ('tpl_demo_doc', 'ws_demo', 'Demo Follow-up Doc', 'google_doc', '{"title":"Follow-up","sections":["Summary","Next Steps"]}'::jsonb, false, 'user_demo_owner')
on conflict (id) do nothing;

-- Example feature flags
insert into public.feature_flags (id, workspace_id, flag_key, enabled, value, updated_by)
values
  ('ff_demo_retries', 'ws_demo', 'workflow_retries', true, '{"max_attempts":3}'::jsonb, 'user_demo_owner'),
  ('ff_global_beta_ui', null, 'beta_integrations_ui', true, '{"rollout":"all"}'::jsonb, 'user_demo_owner')
on conflict (id) do update set
  enabled = excluded.enabled,
  value = excluded.value,
  updated_by = excluded.updated_by;

-- Demo subscription
insert into public.subscriptions (id, workspace_id, billing_plan_id, status, current_period_start, current_period_end)
values ('sub_demo', 'ws_demo', 'plan_pro', 'active', now(), now() + interval '30 days')
on conflict (id) do nothing;
