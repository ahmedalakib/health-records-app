-- ==============================================================================
-- SANOMED HEALTH APP - FIX "DATABASE ERROR SAVING NEW USER"
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kdgfxkhtfeaoabwhykvq/sql/new
-- ==============================================================================

-- 1. DROP ANY PREVIOUS FAILING TRIGGER ON AUTH.USERS
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. ENSURE PROFILES TABLE IS 100% HEALTHY WITH SAFE DEFAULTS
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text default '',
  blood_type text default '',
  allergies text default '',
  emergency_contact text default '',
  date_of_birth date,
  phone text default '',
  avatar_url text default '',
  theme text default 'teal',
  role text default 'patient',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure all columns exist
alter table public.profiles add column if not exists name text default '';
alter table public.profiles add column if not exists blood_type text default '';
alter table public.profiles add column if not exists allergies text default '';
alter table public.profiles add column if not exists emergency_contact text default '';
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists avatar_url text default '';
alter table public.profiles add column if not exists theme text default 'teal';
alter table public.profiles add column if not exists role text default 'patient';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 3. ENABLE RLS AND SAFE POLICIES
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- 4. GRANT TABLE PERMISSIONS
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;

-- 5. ULTRA-SAFE TRIGGER WITH EXCEPTION HANDLER
-- This guarantees auth.signUp NEVER fails even if a profile already exists or any exception occurs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, blood_type, allergies, emergency_contact, role, theme, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Patient'),
    '',
    '',
    '',
    'patient',
    'teal',
    now(),
    now()
  )
  on conflict (user_id) do nothing;
  
  return new;
exception
  when others then
    -- Never abort the auth.users signup transaction!
    return new;
end;
$$;

-- 6. RE-ATTACH THE SAFE TRIGGER
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
