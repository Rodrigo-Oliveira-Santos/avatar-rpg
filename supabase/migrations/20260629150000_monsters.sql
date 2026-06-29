-- ============================================================
-- Avatar RPG — Monsters table
--
-- Persistent catalogue of NPC creatures the GM can spawn into a Hub
-- encounter. Visible only to gm/admin in the catalogue page; when a
-- monster has `in_play = true` its card surfaces inside the player Hub
-- so the whole party can see HP, attributes and status effects.
--
-- Mechanical side (turn ticks, auto damage, initiative…) is *not*
-- handled here — this is data + display only.
-- ============================================================

create table if not exists monsters (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  level           int  not null default 1 check (level between 1 and 99),

  -- Combat resources (mutable during play)
  hp_current      int  not null default 10,
  hp_max          int  not null default 10,
  defense         int  not null default 10,
  dodge           int  not null default 10,

  -- Stats — same 6 attributes used by characters
  attr_for        int  not null default 8,
  attr_agi        int  not null default 8,
  attr_chi        int  not null default 8,
  attr_per        int  not null default 8,
  attr_res        int  not null default 8,
  attr_esp        int  not null default 8,

  -- Rich, schemaless metadata kept as JSONB for easy iteration without migrations:
  --   attacks: [{ id, name, damage, range, effect, notes }]
  --   loot_table: [{ kind: 'item'|'custom', item_id?, name?, quantity, drop_rate? }]
  --   status_effects: [{ id, name, type, icon?, description?, custom? }]
  attacks         jsonb not null default '[]',
  loot_table      jsonb not null default '[]',
  status_effects  jsonb not null default '[]',

  notes           text,
  in_play         boolean not null default false,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_monsters_in_play on monsters (in_play) where in_play = true;
create index if not exists idx_monsters_created_by on monsters (created_by);

-- Permissive RLS for local dev (mirrors the relax_rls_pre_auth migration);
-- tighten when Supabase Auth + GM role checks are wired in.
alter table monsters enable row level security;
drop policy if exists "monsters_dev_all" on monsters;
create policy "monsters_dev_all" on monsters
  for all using (true) with check (true);

-- Touch updated_at on each write so the UI can show "last edited".
create or replace function set_monsters_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_monsters_updated_at on monsters;
create trigger trg_monsters_updated_at
  before update on monsters
  for each row execute function set_monsters_updated_at();
