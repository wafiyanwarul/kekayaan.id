-- ============================================
-- kekayaan.id — Database Migration (Consolidated & Role System)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABLES CREATION
-- ============================================

-- ASSETS TABLE
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  current_value numeric(18,2) not null default 0,
  is_liquid boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ASSET SNAPSHOTS TABLE
create table if not exists public.asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  value numeric(18,2) not null,
  snapshot_date date not null,
  unique(asset_id, snapshot_date)
);

-- TRANSACTION CATEGORIES TABLE
-- Note: user_id is nullable to support global default categories
create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income','expense'))
);

-- TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(18,2) not null,
  type text not null check (type in ('income','expense')),
  category_id uuid references public.transaction_categories(id),
  transaction_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- GOALS TABLE
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(18,2) not null,
  target_date date not null,
  goal_type text not null,
  created_at timestamptz not null default now()
);

-- MONTHLY CYCLES TABLE
create table if not exists public.monthly_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  start_day int not null default 25,
  end_day int not null default 24
);

-- USER ROLES TABLE
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('user', 'admin', 'super_admin')) default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROLE CHANGE REQUESTS TABLE (FOR ADMIN PROMOTING USERS TO ADMIN)
create table if not exists public.role_change_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_role text not null check (requested_role in ('admin', 'super_admin')) default 'admin',
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, status) -- prevent multiple pending/approved requests for the same user
);

-- Ensure user_id is nullable in transaction_categories just in case the table already existed
alter table public.transaction_categories alter column user_id drop not null;

-- ============================================
-- 2. HELPER FUNCTIONS
-- ============================================

-- Security Definer to get active user role without RLS infinite recursion
create or replace function public.get_my_role()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return (select role from public.user_roles where user_id = auth.uid());
end;
$$;

-- Auto-update updated_at helper
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- Triggers for updated_at (with drop if exists)
drop trigger if exists assets_updated_at on public.assets cascade;
drop trigger if exists assets_updated_at on assets cascade;
create trigger assets_updated_at before update on public.assets
  for each row execute function update_updated_at();

-- Trigger to execute role updates when a request is approved by super admin
create or replace function public.handle_role_change_approval()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update public.user_roles
    set role = new.requested_role,
        updated_at = now()
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_role_change_approved on public.role_change_requests cascade;
create trigger on_role_change_approved
  after update of status on public.role_change_requests
  for each row execute function public.handle_role_change_approval();

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
alter table public.assets enable row level security;
alter table public.asset_snapshots enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.monthly_cycles enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_change_requests enable row level security;

-- ASSETS POLICIES
drop policy if exists "Users can view own assets" on public.assets;
create policy "Users can view own assets" on public.assets for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own assets" on public.assets;
create policy "Users can insert own assets" on public.assets for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own assets" on public.assets;
create policy "Users can update own assets" on public.assets for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own assets" on public.assets;
create policy "Users can delete own assets" on public.assets for delete using (auth.uid() = user_id);

-- ASSET SNAPSHOTS POLICIES
drop policy if exists "Users can view own snapshots" on public.asset_snapshots;
create policy "Users can view own snapshots" on public.asset_snapshots for select
  using (exists (select 1 from public.assets where id = asset_id and user_id = auth.uid()));

drop policy if exists "Users can insert own snapshots" on public.asset_snapshots;
create policy "Users can insert own snapshots" on public.asset_snapshots for insert
  with check (exists (select 1 from public.assets where id = asset_id and user_id = auth.uid()));

-- TRANSACTIONS POLICIES
drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- GOALS POLICIES
drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);

-- MONTHLY CYCLES POLICIES
drop policy if exists "Users can manage own cycle" on public.monthly_cycles;
create policy "Users can manage own cycle" on public.monthly_cycles for all using (auth.uid() = user_id);

-- USER ROLES POLICIES
drop policy if exists "Users can view own role" on public.user_roles;
create policy "Users can view own role" on public.user_roles for select
  using (auth.uid() = user_id);

drop policy if exists "Admins and Super Admins can view all roles" on public.user_roles;
create policy "Admins and Super Admins can view all roles" on public.user_roles for select
  using (public.get_my_role() in ('admin', 'super_admin'));

drop policy if exists "Only Super Admins can update roles" on public.user_roles;
create policy "Only Super Admins can update roles" on public.user_roles for update
  using (public.get_my_role() = 'super_admin')
  with check (public.get_my_role() = 'super_admin');

-- ROLE CHANGE REQUESTS POLICIES
drop policy if exists "Admins and Super Admins can view requests" on public.role_change_requests;
create policy "Admins and Super Admins can view requests" on public.role_change_requests for select
  using (public.get_my_role() in ('admin', 'super_admin'));

drop policy if exists "Only Admins can insert requests" on public.role_change_requests;
create policy "Only Admins can insert requests" on public.role_change_requests for insert
  with check (public.get_my_role() = 'admin' and requested_by = auth.uid());

drop policy if exists "Only Super Admins can update requests (approve/reject)" on public.role_change_requests;
create policy "Only Super Admins can update requests (approve/reject)" on public.role_change_requests for update
  using (public.get_my_role() = 'super_admin')
  with check (public.get_my_role() = 'super_admin');

-- TRANSACTION CATEGORIES POLICIES
drop policy if exists "Users can view own and default categories" on public.transaction_categories;
create policy "Users can view own and default categories" on public.transaction_categories for select
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can insert own or default categories" on public.transaction_categories;
create policy "Users can insert own or default categories" on public.transaction_categories for insert
  with check (
    (auth.uid() = user_id) or
    (user_id is null and public.get_my_role() in ('admin', 'super_admin'))
  );

drop policy if exists "Users can update own or default categories" on public.transaction_categories;
create policy "Users can update own or default categories" on public.transaction_categories for update
  using (
    (auth.uid() = user_id) or
    (user_id is null and public.get_my_role() in ('admin', 'super_admin'))
  )
  with check (
    (auth.uid() = user_id) or
    (user_id is null and public.get_my_role() in ('admin', 'super_admin'))
  );

drop policy if exists "Only Super Admins can delete categories" on public.transaction_categories;
create policy "Only Super Admins can delete categories" on public.transaction_categories for delete
  using (public.get_my_role() = 'super_admin');

-- ============================================
-- 4. SIGNUP TRIGGER FUNCTIONS
-- ============================================

-- Trigger to run when a user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
begin
  -- Determine role based on email address
  if new.email = 'wafiyanwarulhikam12@gmail.com' then
    v_role := 'super_admin';
  elsif new.email = 'andikapratama5689@gmail.com' then
    v_role := 'admin';
  else
    v_role := 'user';
  end if;

  -- Insert into public.user_roles
  insert into public.user_roles (user_id, email, role)
  values (new.id, new.email, v_role)
  on conflict (user_id) do update
  set email = excluded.email;

  -- Create monthly cycle
  insert into public.monthly_cycles (user_id, start_day, end_day)
  values (new.id, 25, 24)
  on conflict (user_id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth.users.id=%: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Recreate signup trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant permissions for triggers and helpers
grant execute on function public.get_my_role() to anon, authenticated, postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role;
grant execute on function public.handle_role_change_approval() to postgres, service_role;

-- ============================================
-- 5. DETAILED ERROR HANDLING FOR UNREGISTERED EMAIL
-- ============================================
create or replace function public.check_email_registered(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_exists boolean;
begin
  select exists (
    select 1 from auth.users where email = p_email
  ) into v_exists;
  return v_exists;
end;
$$;

-- Grant execute permissions for email verification RPC function
grant execute on function public.check_email_registered(text) to anon, authenticated, postgres, service_role;

-- ============================================
-- 6. MIGRATION & SEEDING GLOBAL DEFAULT CATEGORIES
-- ============================================

-- Backfill user_roles table with existing users
insert into public.user_roles (user_id, email, role)
select 
  id, 
  email,
  case 
    when email = 'wafiyanwarulhikam12@gmail.com' then 'super_admin'
    when email = 'andikapratama5689@gmail.com' then 'admin'
    else 'user'
  end as role
from auth.users
on conflict (user_id) do nothing;

-- Seeding & mapping script to create global default categories
-- and map existing user-specific transactions to them
do $$
declare
  v_cat_record record;
  v_new_id uuid;
begin
  -- Define the list of global categories
  for v_cat_record in 
    select name, type from (
      values
        ('Gaji', 'income'),
        ('Freelance', 'income'),
        ('Bonus', 'income'),
        ('Bisnis', 'income'),
        ('Hadiah', 'income'),
        ('Dividen / Investasi', 'income'),
        ('Lainnya', 'income'),
        ('Makanan', 'expense'),
        ('Transportasi', 'expense'),
        ('Sewa', 'expense'),
        ('Tagihan / Langganan', 'expense'),
        ('Keluarga', 'expense'),
        ('Kesehatan', 'expense'),
        ('Hiburan', 'expense'),
        ('Belanja', 'expense'),
        ('Investasi', 'expense'),
        ('Lain-lain', 'expense')
    ) as t(name, type)
  loop
    -- Check if global category already exists, if not, create it
    select id into v_new_id 
    from public.transaction_categories 
    where name = v_cat_record.name and type = v_cat_record.type and user_id is null;
    
    if v_new_id is null then
      insert into public.transaction_categories (name, type, user_id)
      values (v_cat_record.name, v_cat_record.type, null)
      returning id into v_new_id;
    end if;

    -- Update existing transactions mapping
    update public.transactions t
    set category_id = v_new_id
    from public.transaction_categories tc
    where t.category_id = tc.id
      and tc.name = v_cat_record.name
      and tc.type = v_cat_record.type
      and tc.user_id is not null;

    -- Map old Internet category to Tagihan / Langganan
    if v_cat_record.name = 'Tagihan / Langganan' then
      update public.transactions t
      set category_id = v_new_id
      from public.transaction_categories tc
      where t.category_id = tc.id
        and tc.name = 'Internet'
        and tc.type = 'expense';
    end if;

    -- Map old Dividen category to Dividen / Investasi
    if v_cat_record.name = 'Dividen / Investasi' then
      update public.transactions t
      set category_id = v_new_id
      from public.transaction_categories tc
      where t.category_id = tc.id
        and tc.name = 'Dividen'
        and tc.type = 'income';
    end if;

    -- Delete user-specific duplicate default categories
    delete from public.transaction_categories
    where name = v_cat_record.name and type = v_cat_record.type and user_id is not null;
  end loop;

  -- Clean up other old categories
  delete from public.transaction_categories
  where name in ('Internet', 'Dividen') and user_id is not null;
end $$;

-- ============================================
-- 7. SYSTEM SETTINGS & MAINTENANCE LOGS
-- ============================================

-- SYSTEM SETTINGS TABLE
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- MAINTENANCE LOGS TABLE
create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  duration_seconds int not null,
  description text not null,
  performed_by uuid not null references auth.users(id) on delete cascade
);

-- Enable RLS
alter table public.system_settings enable row level security;
alter table public.maintenance_logs enable row level security;

-- SYSTEM SETTINGS POLICIES
drop policy if exists "Anyone can view system settings" on public.system_settings;
create policy "Anyone can view system settings" on public.system_settings for select using (true);

drop policy if exists "Only Admins/Super Admins can manage system settings" on public.system_settings;
create policy "Only Admins/Super Admins can manage system settings" on public.system_settings
  for all using (public.get_my_role() in ('admin', 'super_admin'));

-- MAINTENANCE LOGS POLICIES
drop policy if exists "Only Admins/Super Admins can manage maintenance logs" on public.maintenance_logs;
create policy "Only Admins/Super Admins can manage maintenance logs" on public.maintenance_logs
  for all using (public.get_my_role() in ('admin', 'super_admin'));

-- Seed default maintenance setting
insert into public.system_settings (key, value)
values ('maintenance', '{"is_active": false, "type": "instant", "scheduled_start": null, "scheduled_end": null, "active_since": null}'::jsonb)
on conflict (key) do nothing;

-- ============================================
-- 8. AUTOMATIC SNAPSHOT TRIGGER & BACKFILL
-- ============================================

-- Function to handle asset snapshots automatically
create or replace function public.handle_asset_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.asset_snapshots (asset_id, value, snapshot_date)
  values (new.id, new.current_value, current_date)
  on conflict (asset_id, snapshot_date) do update
  set value = excluded.value;
  return new;
end;
$$;

-- Trigger to record snapshot when asset value changes
drop trigger if exists on_asset_changed on public.assets cascade;
create trigger on_asset_changed
  after insert or update of current_value on public.assets
  for each row execute function public.handle_asset_change();

-- Backfill initial snapshots for existing assets if they don't have one
insert into public.asset_snapshots (asset_id, value, snapshot_date)
select id, current_value, current_date
from public.assets
on conflict (asset_id, snapshot_date) do nothing;


