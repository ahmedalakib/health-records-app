-- ==============================================================================
-- SANOMED HEALTH APP - SUPABASE DATABASE FOUNDATION
-- Migration: Initial Schema, Profiles, Vitals, Medications, Visits, Documents
-- ==============================================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  name text,
  blood_type text,
  allergies text,
  emergency_contact text,
  date_of_birth date,
  phone text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. MEDICATIONS TABLE
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dosage text,
  frequency text,
  prescribed_by text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now() not null
);

-- 3. VITALS TABLE
create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null, -- 'Blood Pressure', 'Heart Rate', 'Blood Glucose', 'Temperature', 'Oxygen Saturation'
  value text not null,
  unit text,
  recorded_at timestamptz default now() not null,
  notes text,
  created_at timestamptz default now() not null
);

-- 4. VISITS TABLE
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  doctor_name text not null,
  specialty text,
  visit_date date not null,
  diagnosis text,
  prescriptions text,
  notes text,
  created_at timestamptz default now() not null
);

-- 5. DOCUMENTS / LAB REPORTS TABLE
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  tags text[],
  uploaded_at timestamptz default now() not null
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_medications_user_id on public.medications(user_id);
create index if not exists idx_vitals_user_id on public.vitals(user_id);
create index if not exists idx_vitals_recorded_at on public.vitals(recorded_at desc);
create index if not exists idx_visits_user_id on public.visits(user_id);
create index if not exists idx_visits_visit_date on public.visits(visit_date desc);
create index if not exists idx_documents_user_id on public.documents(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can strictly access only their own medical data
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.vitals enable row level security;
alter table public.visits enable row level security;
alter table public.documents enable row level security;

-- PROFILES RLS
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- MEDICATIONS RLS
create policy "Users can view own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

-- VITALS RLS
create policy "Users can view own vitals"
  on public.vitals for select
  using (auth.uid() = user_id);

create policy "Users can insert own vitals"
  on public.vitals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vitals"
  on public.vitals for update
  using (auth.uid() = user_id);

create policy "Users can delete own vitals"
  on public.vitals for delete
  using (auth.uid() = user_id);

-- VISITS RLS
create policy "Users can view own visits"
  on public.visits for select
  using (auth.uid() = user_id);

create policy "Users can insert own visits"
  on public.visits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own visits"
  on public.visits for update
  using (auth.uid() = user_id);

create policy "Users can delete own visits"
  on public.visits for delete
  using (auth.uid() = user_id);

-- DOCUMENTS RLS
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON USER SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    now(),
    now()
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution after auth.users row creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (AVATARS & MEDICAL DOCUMENTS)
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: Avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Users can update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage RLS: Documents bucket (Private medical records)
create policy "Users can view own documents storage"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own documents storage"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents storage"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
