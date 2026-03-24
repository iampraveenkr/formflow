alter table public.forms
  add column if not exists schema_json jsonb not null default '{}'::jsonb,
  add column if not exists schema_version_hash text;

alter table public.form_fields
  add column if not exists internal_field_key text,
  add column if not exists is_supported boolean not null default true,
  add column if not exists removed boolean not null default false;

update public.form_fields
set internal_field_key = coalesce(internal_field_key, external_field_id)
where internal_field_key is null;

alter table public.form_fields
  alter column internal_field_key set not null;

create index if not exists form_fields_internal_field_key_idx
  on public.form_fields(form_id, internal_field_key);
