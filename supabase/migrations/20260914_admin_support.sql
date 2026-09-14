-- ==============================================================================
-- SANOMED HEALTH APP - ADMIN CONSOLE & BROADCASTS MIGRATION
-- Migration: 20260914_admin_support.sql
-- ==============================================================================

-- 1. ADD ROLE COLUMN TO PROFILES TABLE
alter table public.profiles add column if not exists role text default 'patient';

-- Create index for quick role lookups
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. CREATE APP ANNOUNCEMENTS TABLE (GLOBAL BROADCASTS)
create table if not exists public.app_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text default 'info', -- 'info', 'warning', 'success', 'critical'
  action_label text,
  action_url text,
  is_active boolean default true not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

-- Index for active announcements
create index if not exists idx_announcements_active on public.app_announcements(is_active, created_at desc);

-- 3. ENABLE ROW-LEVEL SECURITY ON ANNOUNCEMENTS
alter table public.app_announcements enable row level security;

-- Authenticated and anonymous users can read active announcements
drop policy if exists "Anyone can read active announcements" on public.app_announcements;
create policy "Anyone can read active announcements" 
  on public.app_announcements 
  for select 
  using (is_active = true and (expires_at is null or expires_at > now()));

-- Only users with role = 'admin' can insert/update/delete announcements
drop policy if exists "Admins can manage announcements" on public.app_announcements;
create policy "Admins can manage announcements" 
  on public.app_announcements 
  for all 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.user_id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 4. SECURE ADMIN ANALYTICS RPC FUNCTION
-- Aggregates metrics securely across the entire platform
create or replace function public.get_admin_analytics()
returns json
language plpgsql
security definer
as $$
declare
  is_caller_admin boolean;
  total_users integer;
  total_meds integer;
  total_vitals integer;
  total_visits integer;
  total_docs integer;
  active_broadcasts integer;
  new_users_week integer;
  result json;
begin
  -- Verify caller is admin
  select (role = 'admin') into is_caller_admin
  from public.profiles
  where user_id = auth.uid();

  if is_caller_admin is not true then
    raise exception 'Access Denied: Caller is not an authorized administrator.';
  end if;

  -- Calculate summary stats
  select count(*) into total_users from public.profiles;
  select count(*) into total_meds from public.medications;
  select count(*) into total_vitals from public.vitals;
  select count(*) into total_visits from public.visits;
  select count(*) into total_docs from public.documents;
  select count(*) into active_broadcasts from public.app_announcements where is_active = true;
  select count(*) into new_users_week from public.profiles where created_at >= (now() - interval '7 days');

  result := json_build_object(
    'total_users', total_users,
    'total_medications', total_meds,
    'total_vitals', total_vitals,
    'total_visits', total_visits,
    'total_documents', total_docs,
    'active_broadcasts', active_broadcasts,
    'new_users_week', new_users_week,
    'timestamp', now()
  );

  return result;
end;
$$;

-- 5. FUNCTION TO SEARCH ALL PATIENTS (ADMIN ONLY)
create or replace function public.get_admin_patients_list(search_query text default '')
returns table (
  id uuid,
  user_id uuid,
  name text,
  blood_type text,
  allergies text,
  emergency_contact text,
  phone text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
as $$
declare
  is_caller_admin boolean;
begin
  select (profiles.role = 'admin') into is_caller_admin
  from public.profiles
  where profiles.user_id = auth.uid();

  if is_caller_admin is not true then
    raise exception 'Access Denied: Caller is not an authorized administrator.';
  end if;

  return query
  select 
    p.id,
    p.user_id,
    p.name,
    p.blood_type,
    p.allergies,
    p.emergency_contact,
    p.phone,
    p.role,
    p.created_at,
    p.updated_at
  from public.profiles p
  where 
    search_query = '' 
    or p.name ilike '%' || search_query || '%'
    or p.phone ilike '%' || search_query || '%'
    or p.blood_type ilike '%' || search_query || '%'
  order by p.created_at desc
  limit 100;
end;
$$;
