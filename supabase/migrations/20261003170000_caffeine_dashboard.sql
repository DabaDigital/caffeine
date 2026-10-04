-- Caffeine dashboard: roles, menu, locations, social links, contacts and reviews.
--
-- Everything the homepage shows lives in these tables. Visitors (anon) can only
-- read visible rows; only profiles with role = 'admin' can create, edit or delete.
-- The script is idempotent, so it can be pasted into the Supabase SQL editor or
-- applied with `supabase db push`.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.app_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end
$$;

-- Helpers live outside the exposed `public` schema so they are not callable
-- through the Data API.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 80),
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Security definer: policies can check the caller's role without recursing
-- into the RLS policies on `profiles`.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- Every new auth user gets a profile with the default, non-admin role.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- Never allow the last admin to be demoted, so the dashboard cannot be locked.
create or replace function private.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and new.role <> 'admin' and not exists (
    select 1 from public.profiles where role = 'admin' and id <> old.id
  ) then
    raise exception 'At least one admin is required.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_keep_one_admin on public.profiles;
create trigger profiles_keep_one_admin
  before update of role on public.profiles
  for each row execute function private.protect_last_admin();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Accounts created before this migration also need a profile.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "Users read their own profile, admins read all" on public.profiles;
create policy "Users read their own profile, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
-- Only these columns are editable, and only by admins (see policy above).
grant update (role, full_name) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  description text check (char_length(description) <= 300),
  icon text not null default 'coffee'
    check (icon in ('coffee', 'iced', 'tea', 'sweet', 'cake', 'pastry', 'juice', 'food', 'dessert')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_name_unique
  on public.categories (lower(btrim(name)));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  -- Restrict: a category with products cannot be deleted by accident.
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (char_length(description) <= 200),
  details text check (char_length(details) <= 1000),
  price numeric(10, 2) check (price >= 0),
  image_url text check (image_url ~ '^(/|https?://)'),
  badge text check (char_length(badge) <= 40),
  highlight_word text check (char_length(highlight_word) <= 16),
  tagline text check (char_length(tagline) <= 80),
  ingredients text[] not null default '{}' check (cardinality(ingredients) <= 8),
  is_featured boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products (category_id);

comment on column public.products.description is 'Short line shown on menu cards.';
comment on column public.products.details is 'Longer text shown in the product dialog.';
comment on column public.products.badge is 'Small label above the photo, e.g. NEW or ICED & EASY.';
comment on column public.products.highlight_word is 'Large italic word behind the homepage photo, e.g. chill.';
comment on column public.products.tagline is 'Handwritten caption, e.g. your daily pick-me-up.';
comment on column public.products.is_featured is 'Featured products fill the homepage carousel.';

-- ---------------------------------------------------------------------------
-- Locations, social links, contacts, reviews
-- ---------------------------------------------------------------------------

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  area text check (char_length(area) <= 80),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  address text check (char_length(address) <= 200),
  phone text check (char_length(phone) <= 40),
  opening_hours text check (char_length(opening_hours) <= 400),
  map_url text check (map_url ~* '^https?://'),
  image_url text check (image_url ~ '^(/|https?://)'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.locations.map_url is 'Google Maps link. When empty, the site links to a Maps search.';

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null
    check (platform in ('instagram', 'facebook', 'tiktok', 'x', 'youtube', 'snapchat', 'linkedin', 'pinterest', 'website')),
  label text check (char_length(label) <= 60),
  url text not null check (url ~* '^https?://' and char_length(url) <= 300),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('phone', 'email', 'whatsapp')),
  label text check (char_length(label) <= 60),
  value text not null check (char_length(btrim(value)) between 3 and 120),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (char_length(btrim(author_name)) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 1 and 1000),
  source text check (char_length(source) <= 40),
  reviewed_on date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Shared triggers, grants and row level security for content tables
-- ---------------------------------------------------------------------------

do $$
declare
  content_table text;
  visible_column text;
begin
  foreach content_table in array array['categories', 'products', 'locations', 'social_links', 'contacts', 'reviews']
  loop
    visible_column := case
      when content_table = 'products' then 'is_available'
      when content_table = 'reviews' then 'is_published'
      else 'is_active'
    end;

    execute format('drop trigger if exists %I on public.%I', content_table || '_set_updated_at', content_table);
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      content_table || '_set_updated_at',
      content_table
    );

    execute format('alter table public.%I enable row level security', content_table);

    execute format('revoke all on table public.%I from anon, authenticated', content_table);
    execute format('grant select on table public.%I to anon, authenticated', content_table);
    execute format('grant insert, update, delete on table public.%I to authenticated', content_table);

    execute format('drop policy if exists "Anyone reads visible rows" on public.%I', content_table);
    execute format(
      'create policy "Anyone reads visible rows" on public.%I for select to anon, authenticated using (%I or (select private.is_admin()))',
      content_table,
      visible_column
    );

    execute format('drop policy if exists "Admins insert rows" on public.%I', content_table);
    execute format(
      'create policy "Admins insert rows" on public.%I for insert to authenticated with check ((select private.is_admin()))',
      content_table
    );

    execute format('drop policy if exists "Admins update rows" on public.%I', content_table);
    execute format(
      'create policy "Admins update rows" on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      content_table
    );

    execute format('drop policy if exists "Admins delete rows" on public.%I', content_table);
    execute format(
      'create policy "Admins delete rows" on public.%I for delete to authenticated using ((select private.is_admin()))',
      content_table
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Image storage: public reads, admin-only writes
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read media objects" on storage.objects;
create policy "Admins read media objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_admin()));

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select private.is_admin()))
  with check (bucket_id = 'media' and (select private.is_admin()));

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- First admin
-- ---------------------------------------------------------------------------
-- Create your account in Authentication > Users, then promote it:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
