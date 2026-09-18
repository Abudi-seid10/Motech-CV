-- Run this in your Supabase project's SQL editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  slug        text not null unique,
  name        text not null default '',
  email       text not null,
  plan        text not null default 'free' check (plan in ('free', 'basic', 'pro')),
  is_public   boolean not null default true,
  theme       text not null default 'editorial-gold',
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$'),
  constraint slug_not_reserved check (
    slug not in (
      'api','login','signup','logout','edit','card','me','admin','assets','static',
      'favicon.ico','grain.png','index','index.html','robots.txt','sitemap.xml'
    )
  )
);

alter table public.profiles enable row level security;

-- Visitors can read any profile marked public.
create policy "Public profiles are readable by anyone"
  on public.profiles for select
  using (is_public = true);

-- Owners can always read their own row, public or not.
create policy "Owners can read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Owners can edit their own row. No insert/delete policy for regular users —
-- profile rows are created automatically by the trigger below, one per signup.
create policy "Owners can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row the moment someone signs up. `name` and
-- `slug` come from the metadata the app passes to supabase.auth.signUp():
--   supabase.auth.signUp({ email, password, options: { data: { name, slug } } })
-- If the chosen slug is already taken, this insert fails on the unique
-- constraint — which fails signUp() itself, surfacing the error to the form.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, slug, name, email, data)
  values (
    new.id,
    new.raw_user_meta_data->>'slug',
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    '{}'::jsonb
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Slug availability check the signup form calls live, without exposing any
-- profile data (SECURITY DEFINER bypasses RLS just for this boolean check).
--   supabase.rpc('slug_available', { check_slug: 'abudi' })
-- ---------------------------------------------------------------------------
create or replace function public.slug_available(check_slug text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where slug = check_slug);
$$;

grant execute on function public.slug_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- After running this file:
-- Authentication → Providers → confirm Email is enabled.
-- Authentication → Settings → "Confirm email": if ON, new users must click a
--   confirmation link before they get a session (the signup form handles
--   this and shows a "check your email" message). If OFF, signup logs them
--   straight into /edit. Either is fine — pick based on how public this
--   deployment is.
-- `plan` defaults to 'free' and isn't enforced anywhere yet — it's there so
--   adding Starter/Basic/Pro billing later doesn't require a migration.
-- `me` is reserved and NOT claimable at signup — /me and /card/me are a
--   built-in demo rendered from bundled example data (src/data/profile.example.json),
--   not a real account. See src/hooks/useProfile.ts.
-- ---------------------------------------------------------------------------
