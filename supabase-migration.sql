-- ============================================
-- kekayaan.id — Database Migration (Consolidated)
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
create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- ============================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.assets enable row level security;
alter table public.asset_snapshots enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.monthly_cycles enable row level security;

-- ASSETS POLICIES
create policy "Users can view own assets" on public.assets for select using (auth.uid() = user_id);
create policy "Users can insert own assets" on public.assets for insert with check (auth.uid() = user_id);
create policy "Users can update own assets" on public.assets for update using (auth.uid() = user_id);
create policy "Users can delete own assets" on public.assets for delete using (auth.uid() = user_id);

-- ASSET SNAPSHOTS POLICIES
create policy "Users can view own snapshots" on public.asset_snapshots for select
  using (exists (select 1 from public.assets where id = asset_id and user_id = auth.uid()));
create policy "Users can insert own snapshots" on public.asset_snapshots for insert
  with check (exists (select 1 from public.assets where id = asset_id and user_id = auth.uid()));

-- TRANSACTION CATEGORIES POLICIES
create policy "Users can manage own categories" on public.transaction_categories for all using (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- GOALS POLICIES
create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);

-- MONTHLY CYCLES POLICIES
create policy "Users can manage own cycle" on public.monthly_cycles for all using (auth.uid() = user_id);

-- ============================================
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger assets_updated_at before update on public.assets
  for each row execute function update_updated_at();

-- ============================================
-- 4. DEFAULT CATEGORIES & SIGNUP FUNCTIONS
-- ============================================
create or replace function public.create_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.transaction_categories (user_id, name, type)
  select p_user_id, name, type
  from (
    values
      ('Gaji', 'income'),
      ('Freelance', 'income'),
      ('Bonus', 'income'),
      ('Bisnis', 'income'),
      ('Hadiah', 'income'),
      ('Lainnya', 'income'),
      ('Makanan', 'expense'),
      ('Transportasi', 'expense'),
      ('Sewa', 'expense'),
      ('Internet', 'expense'),
      ('Keluarga', 'expense'),
      ('Kesehatan', 'expense'),
      ('Hiburan', 'expense'),
      ('Belanja', 'expense'),
      ('Lain-lain', 'expense')
  ) as defaults(name, type)
  where not exists (
    select 1
    from public.transaction_categories existing
    where existing.user_id = p_user_id
  );

  insert into public.monthly_cycles (user_id, start_day, end_day)
  values (p_user_id, 25, 24)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.create_default_categories(new.id);
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for auth.users.id=%: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Recreate trigger on auth.users for signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant execute permissions for signup functions
grant execute on function public.create_default_categories(uuid) to postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role;

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
