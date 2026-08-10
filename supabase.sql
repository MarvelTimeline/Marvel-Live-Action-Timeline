-- Marvel Timeline: Supabase setup
-- 1) Create a free Supabase project.
-- 2) Create your admin account in the site's Admin Login screen.
-- 3) Replace YOUR_ADMIN_EMAIL below with the exact email you use to log in.
-- 4) Run this whole script in Supabase SQL Editor.

create table if not exists public.timeline_entries (
  id text primary key,
  title text not null,
  release_year integer,
  setting text default '',
  universe text default '',
  description jsonb not null default '[]'::jsonb,
  poster text default '',
  era text default '',
  sort_order integer not null default 0,
  rating numeric,
  notes text default '',
  owner_id uuid references auth.users(id) on delete cascade
);

alter table public.timeline_entries enable row level security;

drop policy if exists "Public can view timeline" on public.timeline_entries;
create policy "Public can view timeline"
on public.timeline_entries for select
using (true);

drop policy if exists "Admin can insert timeline" on public.timeline_entries;
create policy "Admin can insert timeline"
on public.timeline_entries for insert
with check (
  owner_id = auth.uid()
  and lower(coalesce((select email from auth.users where id = auth.uid()), '')) = lower('YOUR_ADMIN_EMAIL')
);

drop policy if exists "Admin can update timeline" on public.timeline_entries;
create policy "Admin can update timeline"
on public.timeline_entries for update
using (
  owner_id = auth.uid()
  and lower(coalesce((select email from auth.users where id = auth.uid()), '')) = lower('YOUR_ADMIN_EMAIL')
)
with check (
  owner_id = auth.uid()
  and lower(coalesce((select email from auth.users where id = auth.uid()), '')) = lower('YOUR_ADMIN_EMAIL')
);

drop policy if exists "Admin can delete timeline" on public.timeline_entries;
create policy "Admin can delete timeline"
on public.timeline_entries for delete
using (
  owner_id = auth.uid()
  and lower(coalesce((select email from auth.users where id = auth.uid()), '')) = lower('YOUR_ADMIN_EMAIL')
);

-- Optional: if you want the site to be able to create accounts with email/password,
-- leave Supabase Auth's email/password provider enabled.
