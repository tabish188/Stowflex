-- StowFlex blog admin: run this once in Supabase > SQL Editor.
--
-- Security model
--   * The public (anon key) can only READ posts whose status = 'published'.
--   * Only a signed-in user can create / edit / delete posts and upload images.
--     Create that one admin user in Supabase > Authentication > Users > Add user:
--         email:    stowflex@admin.stowflex.com   (the panel maps login ID "stowflex" to this)
--         password: (your password)   -> tick "Auto Confirm User"
--     Then turn OFF public sign-ups: Authentication > Providers > Email > "Allow new users to sign up".

create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title                text not null,
  status               text not null default 'draft' check (status in ('draft', 'published')),
  excerpt              text default '',
  body                 text default '',
  image                text default '',
  image_position       text default 'center',
  author               text default 'StowFlex Team',
  category             text default 'Insight',
  tags                 text[] default '{}',
  related_service_name text,
  related_service_url  text,
  focus_keyword        text default '',
  meta_title           text default '',
  meta_description     text default '',
  canonical_url        text default '',
  og_image             text default '',
  noindex              boolean not null default false,
  published_at         date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

alter table public.posts enable row level security;

drop policy if exists "public reads published" on public.posts;
create policy "public reads published" on public.posts
  for select to anon using (status = 'published');

drop policy if exists "admin full access" on public.posts;
create policy "admin full access" on public.posts
  for all to authenticated using (true) with check (true);

-- Image storage (public bucket so blog pages can show the images).
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "public reads blog images" on storage.objects;
create policy "public reads blog images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'blog-images');

drop policy if exists "admin writes blog images" on storage.objects;
create policy "admin writes blog images" on storage.objects
  for all to authenticated using (bucket_id = 'blog-images') with check (bucket_id = 'blog-images');

-- Contact / newsletter form submissions.
--   * Written directly from the browser (assets/js/forms.js) using the public
--     anon key - the policy below lets anon INSERT only, never read/update/delete.
--   * Only the signed-in admin can read or delete them (e.g. from Supabase's
--     own Table Editor, or a future HubSpot sync job).
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  form_name    text not null default 'website form',
  name         text,
  company      text,
  email        text,
  phone        text,
  service      text,
  message      text,
  page_url     text,
  landing_page text,
  referrer     text,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  utm_term     text,
  utm_content  text,
  gclid        text,
  fbclid       text,
  msclkid      text,
  li_fat_id    text,
  created_at   timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "admin reads leads" on public.leads;
create policy "admin reads leads" on public.leads
  for select to authenticated using (true);

drop policy if exists "admin deletes leads" on public.leads;
create policy "admin deletes leads" on public.leads
  for delete to authenticated using (true);

drop policy if exists "public inserts leads" on public.leads;
create policy "public inserts leads" on public.leads
  for insert to anon with check (true);
