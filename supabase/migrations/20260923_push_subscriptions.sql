-- ==============================================================================
-- SANOMED HEALTH APP - BACKGROUND PUSH NOTIFICATIONS TABLE & CRON SUPPORT
-- Migration: 20260923_push_subscriptions.sql
-- ==============================================================================

-- 1. PUSH SUBSCRIPTIONS TABLE
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text unique not null,
  subscription jsonb not null,
  timezone text default 'UTC',
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_push_sub_user_id on public.push_subscriptions(user_id);
create index if not exists idx_push_sub_active on public.push_subscriptions(is_active);

-- 2. ENABLE ROW-LEVEL SECURITY
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;
create policy "Users can manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. PERMISSIONS
grant all on table public.push_subscriptions to authenticated, service_role;
