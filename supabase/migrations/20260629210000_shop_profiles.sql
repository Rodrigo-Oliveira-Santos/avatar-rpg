-- ============================================================
-- Avatar RPG — Shop Profiles
--
-- Named bundles of items the GM can toggle "on the shelves" in one click.
-- Activating a profile flips `items.in_shop` so only the bundle's items
-- are visible to players.
-- ============================================================

create table if not exists shop_profiles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  item_ids    uuid[] not null default '{}',
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_shop_profiles_created_by on shop_profiles (created_by);

alter table shop_profiles enable row level security;
drop policy if exists "shop_profiles_dev_all" on shop_profiles;
create policy "shop_profiles_dev_all" on shop_profiles for all using (true) with check (true);

create or replace function set_shop_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shop_profiles_updated_at on shop_profiles;
create trigger trg_shop_profiles_updated_at
  before update on shop_profiles
  for each row execute function set_shop_profiles_updated_at();
