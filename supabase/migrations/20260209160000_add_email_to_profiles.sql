-- Add email column to profiles if it doesn't exist
alter table public.profiles add column if not exists email text;

-- Sync existing users from auth.users to public.profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

-- Ensure the search function works correctly (re-run to be safe, though not strictly changed if it was already pointing to p.email)
-- The previous migration `20260209120000` defined `search_feedback_paginated` using `p.email`. 
-- Now that `p.email` exists and is populated, it should work.

-- Optional: Create or Update a trigger to keep email in sync for new users
-- Assuming there is a `handle_new_user` function. We should update it.
-- Since we don't know the exact name, we can try to replace it if standard, or just create a specific one for email sync if we want to be safe.
-- For now, the backfill covers existing. New users usually get created via trigger. 
-- We'll assume the standard `handle_new_user` copies `new.email` -> `profile.email`.
-- If not, we can add a specific trigger just for this.

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

-- Trigger on auth.users update (email change)
drop trigger if exists on_auth_user_email_update on auth.users;
create trigger on_auth_user_email_update
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();


-- Handle new user creation (Standard Supabase Auth Trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$;

-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

