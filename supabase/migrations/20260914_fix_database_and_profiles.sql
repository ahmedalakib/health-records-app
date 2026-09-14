-- ==============================================================================
-- SANOMED HEALTH APP - COMPREHENSIVE DATABASE FIX & NEW USER AUTO-PROVISIONING
-- Migration: 20260914_fix_database_and_profiles.sql
-- ==============================================================================

-- 1. PROFILES TABLE - ENSURE ALL COLUMNS EXIST
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

-- Add any missing columns to existing profiles table
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

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. MEDICATIONS TABLE
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dosage text default '',
  frequency text default '',
  prescribed_by text default '',
  start_date date,
  end_date date,
  notes text default '',
  created_at timestamptz default now() not null
);

create index if not exists idx_medications_user_id on public.medications(user_id);

-- 3. VITALS TABLE
create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  value text not null,
  unit text default '',
  recorded_at timestamptz default now() not null,
  notes text default '',
  created_at timestamptz default now() not null
);

create index if not exists idx_vitals_user_id on public.vitals(user_id);
create index if not exists idx_vitals_recorded_at on public.vitals(recorded_at desc);

-- 4. VISITS TABLE
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  doctor_name text not null,
  specialty text default '',
  visit_date date default current_date not null,
  diagnosis text default '',
  prescriptions text default '',
  notes text default '',
  created_at timestamptz default now() not null
);

create index if not exists idx_visits_user_id on public.visits(user_id);
create index if not exists idx_visits_visit_date on public.visits(visit_date desc);

-- 5. DOCUMENTS TABLE - ALIGNED WITH FRONTEND SCHEMA
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  file_name text not null default 'Document',
  file_path text not null default '',
  category text default 'General',
  file_type text default '',
  file_size bigint default 0,
  created_at timestamptz default now() not null
);

-- Ensure required columns exist on documents
alter table public.documents add column if not exists file_name text default 'Document';
alter table public.documents add column if not exists file_path text default '';
alter table public.documents add column if not exists category text default 'General';
alter table public.documents add column if not exists file_type text default '';
alter table public.documents add column if not exists file_size bigint default 0;
alter table public.documents add column if not exists created_at timestamptz default now();

create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_created_at on public.documents(created_at desc);

-- 6. APP ANNOUNCEMENTS (FOR BROADCASTS)
create table if not exists public.app_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text default 'info',
  action_label text,
  action_url text,
  is_active boolean default true not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  expires_at timestamptz
);

-- 7. ENABLE ROW-LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.vitals enable row level security;
alter table public.visits enable row level security;
alter table public.documents enable row level security;
alter table public.app_announcements enable row level security;

-- PROFILES POLICIES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);

-- MEDICATIONS POLICIES
drop policy if exists "Users can view own medications" on public.medications;
create policy "Users can view own medications" on public.medications for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own medications" on public.medications;
create policy "Users can insert own medications" on public.medications for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own medications" on public.medications;
create policy "Users can update own medications" on public.medications for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own medications" on public.medications;
create policy "Users can delete own medications" on public.medications for delete using (auth.uid() = user_id);

-- VITALS POLICIES
drop policy if exists "Users can view own vitals" on public.vitals;
create policy "Users can view own vitals" on public.vitals for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own vitals" on public.vitals;
create policy "Users can insert own vitals" on public.vitals for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own vitals" on public.vitals;
create policy "Users can update own vitals" on public.vitals for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own vitals" on public.vitals;
create policy "Users can delete own vitals" on public.vitals for delete using (auth.uid() = user_id);

-- VISITS POLICIES
drop policy if exists "Users can view own visits" on public.visits;
create policy "Users can view own visits" on public.visits for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own visits" on public.visits;
create policy "Users can insert own visits" on public.visits for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own visits" on public.visits;
create policy "Users can update own visits" on public.visits for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own visits" on public.visits;
create policy "Users can delete own visits" on public.visits for delete using (auth.uid() = user_id);

-- DOCUMENTS POLICIES
drop policy if exists "Users can view own documents" on public.documents;
create policy "Users can view own documents" on public.documents for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own documents" on public.documents;
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own documents" on public.documents;
create policy "Users can update own documents" on public.documents for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own documents" on public.documents;
create policy "Users can delete own documents" on public.documents for delete using (auth.uid() = user_id);

-- ANNOUNCEMENTS POLICIES
drop policy if exists "Anyone can read active announcements" on public.app_announcements;
create policy "Anyone can read active announcements" 
  on public.app_announcements 
  for select 
  using (is_active = true and (expires_at is null or expires_at > now()));

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

-- 8. BULLETPROOF AUTOMATIC PROFILE TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_full_name text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Patient'
  );

  insert into public.profiles (user_id, name, blood_type, allergies, emergency_contact, role, theme, created_at, updated_at)
  values (
    new.id,
    user_full_name,
    '',
    '',
    '',
    'patient',
    'teal',
    now(),
    now()
  )
  on conflict (user_id) do update set
    name = case when public.profiles.name = '' or public.profiles.name is null then excluded.name else public.profiles.name end,
    updated_at = now();

  return new;
exception
  when others then
    -- Never block user signup if profile trigger has a minor hiccup
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Users can update own avatars" on storage.objects;
create policy "Users can update own avatars" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can view own documents storage" on storage.objects;
create policy "Users can view own documents storage" on storage.objects for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can upload own documents storage" on storage.objects;
create policy "Users can upload own documents storage" on storage.objects for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete own documents storage" on storage.objects;
create policy "Users can delete own documents storage" on storage.objects for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
