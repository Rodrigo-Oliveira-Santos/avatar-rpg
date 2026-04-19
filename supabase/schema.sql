-- ============================================================
-- Avatar RPG — Supabase Schema
-- Run this in the Supabase SQL Editor to initialize the DB
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Users
-- ============================================================
create table if not exists users (
  id           uuid primary key default uuid_generate_v4(),
  auth_id      uuid unique not null,          -- Supabase Auth user ID
  username     text unique not null,
  role         text not null default 'player' check (role in ('player', 'gm', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- Characters
-- ============================================================
create table if not exists characters (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references users(id) on delete cascade,

  -- Identity
  name             text not null,
  element          text not null default 'none' check (element in ('fire','water','earth','air','none')),
  subclass         text,
  level            int not null default 1 check (level between 1 and 40),
  xp               int not null default 0,
  gold             int not null default 0,
  age              text,
  gender           text,
  alignment        text,
  notes            text,

  -- Attributes (base: 8)
  attr_for         int not null default 8,
  attr_agi         int not null default 8,
  attr_chi         int not null default 8,
  attr_per         int not null default 8,
  attr_res         int not null default 8,
  attr_esp         int not null default 8,
  points_available int not null default 0,

  -- Equipment
  armor_equipped   uuid references items(id) on delete set null,
  companion_id     uuid,

  -- JSON blobs (client-managed state)
  skills_data      jsonb default '{}',
  inventory_data   jsonb default '[]',
  equipment_data   jsonb default '{}',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- Skills
-- ============================================================
create table if not exists skills (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  element         text not null check (element in ('fire','water','earth','air','none')),
  category        text not null check (category in ('spirit','agility','precise','brute')),
  tier            int not null check (tier between 1 and 4),
  description     text,
  position        text default 'any' check (position in ('off','def','pass','any')),
  requirements    jsonb default '{}',          -- { FOR: 10, CHI: 8, ... }
  prerequisites   jsonb default '[]',          -- [ "skill_name", ... ]
  attacks         jsonb default '[]',          -- [ { name, damage, chi_cost, status_effects } ]
  passive_effect  jsonb,                       -- { type, description, chi_cost, value }
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (element, name)
);

-- ============================================================
-- Items
-- ============================================================
create table if not exists items (
  id              uuid primary key default uuid_generate_v4(),
  name            text unique not null,
  description     text,
  type            text not null default 'other' check (type in ('weapon','armor','accessory','consumable','other')),
  rarity          text not null default 'common' check (rarity in ('common','rare','epic','legendary')),
  price           int not null default 0,
  weight_class    text,                        -- light, medium, heavy
  defense_bonus   int default 0,
  dodge_penalty   int default 0,
  attributes      jsonb default '{}',          -- extra attribute bonuses
  in_shop         boolean not null default false,
  gm_notes        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- Character Inventory
-- ============================================================
create table if not exists character_inventory (
  id             uuid primary key default uuid_generate_v4(),
  character_id   uuid not null references characters(id) on delete cascade,
  item_id        uuid not null references items(id) on delete cascade,
  quantity       int not null default 1,
  acquired_from  text,                         -- 'shop' | 'gm' | 'trade' | 'import'
  acquired_at    timestamptz not null default now(),

  unique (character_id, item_id)
);

-- ============================================================
-- Character Skills
-- ============================================================
create table if not exists character_skills (
  id            uuid primary key default uuid_generate_v4(),
  character_id  uuid not null references characters(id) on delete cascade,
  skill_id      uuid not null references skills(id) on delete cascade,
  unlocked_at   timestamptz not null default now(),
  sub_skills    jsonb default '[]',

  unique (character_id, skill_id)
);

-- ============================================================
-- Shop Config
-- ============================================================
create table if not exists shop_config (
  id              uuid primary key default uuid_generate_v4(),
  item_id         uuid not null references items(id) on delete cascade,
  price_override  int,
  nation_filter   text,                        -- restrict to a nation
  is_active       boolean not null default true,
  updated_by      uuid references users(id),
  updated_at      timestamptz not null default now(),

  unique (item_id)
);

-- ============================================================
-- Trade Proposals
-- ============================================================
create table if not exists trade_proposals (
  id             uuid primary key default uuid_generate_v4(),
  sender_id      uuid not null references characters(id) on delete cascade,
  receiver_id    uuid not null references characters(id) on delete cascade,
  items_offered  jsonb default '[]',           -- [ { item_id, quantity } ]
  gold_offered   int not null default 0,
  status         text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz
);

-- ============================================================
-- Notifications
-- ============================================================
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null,                   -- 'gold_reward' | 'item_received' | 'trade_offer' | ...
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  related_id  uuid,                            -- optional: related character/item/trade
  created_at  timestamptz not null default now()
);

-- ============================================================
-- GM Actions Log
-- ============================================================
create table if not exists gm_actions (
  id              uuid primary key default uuid_generate_v4(),
  gm_id           uuid not null references users(id),
  action_type     text not null,               -- 'reward_gold' | 'give_item' | 'import' | ...
  target_char_id  uuid references characters(id),
  details         jsonb default '{}',
  created_at      timestamptz not null default now()
);

-- ============================================================
-- Companions (Future phase)
-- ============================================================
create table if not exists companions (
  id           uuid primary key default uuid_generate_v4(),
  character_id uuid not null references characters(id) on delete cascade,
  name         text not null,
  animal_type  text,
  level        int not null default 1,
  hp_max       int not null default 20,
  hp_current   int not null default 20,
  attack       int not null default 5,
  defense      int not null default 3,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Updated_at triggers
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute function update_updated_at();

create trigger characters_updated_at before update on characters
  for each row execute function update_updated_at();

create trigger skills_updated_at before update on skills
  for each row execute function update_updated_at();

create trigger items_updated_at before update on items
  for each row execute function update_updated_at();

-- ============================================================
-- Indexes
-- ============================================================
create index if not exists idx_characters_user_id on characters(user_id);
create index if not exists idx_characters_element on characters(element);
create index if not exists idx_skills_element on skills(element);
create index if not exists idx_skills_category on skills(category);
create index if not exists idx_character_inventory_character_id on character_inventory(character_id);
create index if not exists idx_notifications_user_id on notifications(user_id, is_read);
create index if not exists idx_gm_actions_gm_id on gm_actions(gm_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table users enable row level security;
alter table characters enable row level security;
alter table character_inventory enable row level security;
alter table character_skills enable row level security;
alter table notifications enable row level security;

-- Users can read their own record; admins can read all
create policy "users_select_own" on users for select
  using (auth.uid() = auth_id);

-- Characters: users can select/update their own
create policy "characters_select_own" on characters for select
  using (user_id in (select id from users where auth_id = auth.uid()));

create policy "characters_insert_own" on characters for insert
  with check (user_id in (select id from users where auth_id = auth.uid()));

create policy "characters_update_own" on characters for update
  using (user_id in (select id from users where auth_id = auth.uid()));

-- Notifications: users see their own
create policy "notifications_select_own" on notifications for select
  using (user_id in (select id from users where auth_id = auth.uid()));
