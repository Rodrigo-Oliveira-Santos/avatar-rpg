-- ============================================================
-- Avatar RPG — Relax RLS for username-only mode
--
-- Until Supabase Auth is wired in, the frontend talks to Postgres
-- using the anon key without an authenticated session. The strict
-- policies defined in the init migration depend on `auth.uid()`,
-- which is NULL in this mode, so every query returns zero rows.
--
-- This migration disables RLS on the tables the client reads/writes
-- directly. When Auth lands, drop this file (or re-enable RLS) and
-- re-add the auth-aware policies.
-- ============================================================

alter table users                enable row level security;
alter table characters           enable row level security;
alter table character_inventory  enable row level security;
alter table character_skills     enable row level security;
alter table notifications        enable row level security;

-- Drop the strict auth-bound policies created by the init migration.
drop policy if exists "users_select_own"        on users;
drop policy if exists "characters_select_own"   on characters;
drop policy if exists "characters_insert_own"   on characters;
drop policy if exists "characters_update_own"   on characters;
drop policy if exists "notifications_select_own" on notifications;

-- Permissive policies so the anon role can operate before Auth lands.
-- These tables are all gated by the app today; tighten when Auth is added.
create policy "dev_users_all"                on users               for all using (true) with check (true);
create policy "dev_characters_all"           on characters          for all using (true) with check (true);
create policy "dev_character_inventory_all"  on character_inventory for all using (true) with check (true);
create policy "dev_character_skills_all"     on character_skills    for all using (true) with check (true);
create policy "dev_notifications_all"        on notifications       for all using (true) with check (true);

-- Tables that didn't have RLS enabled still need read access for anon.
-- (Items / skills / shop_config are public catalogs; enable RLS + permissive read.)
alter table items       enable row level security;
alter table skills      enable row level security;
alter table shop_config enable row level security;

create policy "dev_items_select"  on items       for select using (true);
create policy "dev_items_write"   on items       for all    using (true) with check (true);
create policy "dev_skills_select" on skills      for select using (true);
create policy "dev_skills_write"  on skills      for all    using (true) with check (true);
create policy "dev_shop_select"   on shop_config for select using (true);
