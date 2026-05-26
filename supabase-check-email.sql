-- ============================================================
-- SQL Function: check_email_registered
-- ============================================================
-- Run this in the Supabase SQL Editor to enable detailed email 
-- check when a user attempts to login with an unregistered email.
-- ============================================================

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

-- Grant execute permission to anyone (anon and authenticated roles)
grant execute on function public.check_email_registered(text) to anon, authenticated, postgres, service_role;
