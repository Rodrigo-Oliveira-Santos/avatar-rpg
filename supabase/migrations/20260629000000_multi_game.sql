-- ============================================================
-- Avatar RPG → Multi-game platform
-- Adds tables for the D&D 5e module and the Minecraft Builds module.
-- Same JSON-heavy strategy as `characters` so iteration is cheap.
-- ============================================================

-- ----------------------------------------------------------------
-- D&D 5e characters
-- ----------------------------------------------------------------
create table if not exists dnd_characters (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,

  name        text not null,
  race        text,
  class       text,
  background  text,
  alignment   text,
  level       int not null default 1 check (level between 1 and 20),
  xp          int not null default 0,

  hp_max      int not null default 1,
  hp_current  int not null default 1,
  ac          int not null default 10,
  speed       int not null default 30,

  -- JSON blobs (client-managed)
  abilities   jsonb default '{}',   -- { STR, DEX, CON, INT, WIS, CHA }
  saves       jsonb default '{}',   -- proficiency flags
  skills      jsonb default '{}',   -- proficiency / expertise per skill
  inventory   jsonb default '[]',
  spells      jsonb default '{}',
  features    jsonb default '[]',
  notes       text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_dnd_characters_user on dnd_characters(user_id);

-- ----------------------------------------------------------------
-- Minecraft Builds (metadata only — files live on Google Drive)
-- ----------------------------------------------------------------
create table if not exists mc_builds (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references users(id) on delete cascade,

  title           text not null,
  description     text,
  thumbnail_url   text,   -- external URL
  download_url    text,   -- Drive link to .schematic / .nbt / .litematic

  category        text check (category in ('survival','redstone','farm','aesthetic','adventure','other')),
  tags            text[] default '{}',
  mc_version      text,
  dimensions      jsonb,   -- { x, y, z }
  is_public       boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_mc_builds_owner   on mc_builds(owner_id);
create index if not exists idx_mc_builds_public  on mc_builds(is_public) where is_public = true;
create index if not exists idx_mc_builds_tags    on mc_builds using gin (tags);

create table if not exists mc_build_likes (
  build_id  uuid not null references mc_builds(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  liked_at  timestamptz not null default now(),
  primary key (build_id, user_id)
);

-- ----------------------------------------------------------------
-- updated_at triggers (function already defined in init migration)
-- ----------------------------------------------------------------
create trigger dnd_characters_updated_at before update on dnd_characters
  for each row execute function update_updated_at();

create trigger mc_builds_updated_at before update on mc_builds
  for each row execute function update_updated_at();

-- ----------------------------------------------------------------
-- RLS (permissive while Supabase Auth is not yet wired — mirrors
-- the pre-auth migration approach for the Avatar tables).
-- ----------------------------------------------------------------
alter table dnd_characters enable row level security;
alter table mc_builds      enable row level security;
alter table mc_build_likes enable row level security;

create policy "dev_dnd_characters_all" on dnd_characters for all using (true) with check (true);
create policy "dev_mc_builds_all"      on mc_builds      for all using (true) with check (true);
create policy "dev_mc_build_likes_all" on mc_build_likes for all using (true) with check (true);
