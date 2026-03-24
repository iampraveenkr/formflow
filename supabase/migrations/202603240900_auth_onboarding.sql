-- Authentication + onboarding schema for FormFlow
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  slug text not null unique,
  owner_user_id text not null references public.users(id) on delete restrict,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending', 'complete')),
  business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create unique index if not exists workspace_single_owner_idx
  on public.workspace_members(workspace_id)
  where role = 'owner';
