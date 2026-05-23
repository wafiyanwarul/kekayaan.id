-- Fix Supabase Auth signup failing with:
-- { code: "unexpected_failure", message: "Database error saving new user" }
--
-- Run this in Supabase SQL Editor, or execute it with:
-- npx prisma db execute --file supabase-auth-trigger-fix.sql --schema prisma/diagnose.prisma

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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant execute on function public.create_default_categories(uuid) to postgres, service_role;
grant execute on function public.handle_new_user() to postgres, service_role;
