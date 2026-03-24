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
  updated_at timestamptz not null default now()
);

create index if not exists connected_google_accounts_workspace_idx
  on public.connected_google_accounts(workspace_id);

create index if not exists connected_google_accounts_user_idx
  on public.connected_google_accounts(user_id);
