-- ==============================================================================
-- SANOMED HEALTH APP - CLOUD ERROR/BUG TRACKING & CLOUD EMERGENCY CONTACTS
-- Migration: 20260925_app_errors_and_emergency_fields.sql
-- ==============================================================================

-- 1. ADD EXTENDED EMERGENCY CONTACT FIELDS TO PROFILES TABLE
-- Ensures 100% of emergency medical ID fields live in the Supabase Cloud DB
alter table public.profiles
  add column if not exists emergency_name text default '',
  add column if not exists emergency_phone text default '',
  add column if not exists emergency_relation text default 'Emergency Contact',
  add column if not exists date_of_birth text default '',
  add column if not exists phone text default '';

-- 2. CREATE APP ERRORS & BUG TRACKER TABLE
create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  error_message text not null,
  error_stack text,
  error_type text default 'client_error', -- 'runtime_crash', 'api_failure', 'auth_error', 'database_error'
  severity text default 'error',         -- 'critical', 'error', 'warning', 'info'
  route text default '/',
  user_agent text,
  device_info jsonb default '{}'::jsonb,
  status text default 'unresolved',      -- 'unresolved', 'investigating', 'resolved'
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Indexes for lightning fast searching and filtering in the Admin Console
create index if not exists idx_app_errors_created_at on public.app_errors(created_at desc);
create index if not exists idx_app_errors_status on public.app_errors(status);
create index if not exists idx_app_errors_severity on public.app_errors(severity);
create index if not exists idx_app_errors_user_id on public.app_errors(user_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.app_errors enable row level security;

-- Allow any user (even during auth errors or unauthenticated crashes) to report errors safely
drop policy if exists "Anyone can report an app error" on public.app_errors;
create policy "Anyone can report an app error"
  on public.app_errors
  for insert
  with check (true);

-- Only Admins and Founders can view and manage error reports
drop policy if exists "Admins can view and manage app errors" on public.app_errors;
create policy "Admins can view and manage app errors"
  on public.app_errors
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid()
      and profiles.role in ('admin', 'superadmin')
    )
    or auth.email() in ('ahmedalakibofficial@gmail.com', 'ahmedalakib@gmail.com')
  );

-- 4. GRANT PERMISSIONS
grant insert on public.app_errors to anon, authenticated;
grant all on public.app_errors to authenticated, service_role;
