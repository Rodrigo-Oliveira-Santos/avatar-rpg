-- ============================================================
-- Avatar RPG — Encounters / Turn system
--
-- Two tables:
--   • encounters             — one row per battle (status: pending → active → ended)
--   • encounter_combatants   — participants of that battle, with initiative
--     and turn order. `kind` tells whether `ref_id` points to a character
--     or a monster; we also snapshot `name` so removed characters/monsters
--     don't break the encounter log.
-- ============================================================

create table if not exists encounters (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null default 'Combate',
  status              text not null default 'pending'
                          check (status in ('pending', 'active', 'ended')),
  current_round       int  not null default 1 check (current_round >= 1),
  current_turn_index  int  not null default 0 check (current_turn_index >= 0),
  notes               text,
  created_by          uuid references users(id) on delete set null,
  started_at          timestamptz,
  ended_at            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_encounters_active on encounters (status) where status = 'active';
create index if not exists idx_encounters_created_by on encounters (created_by);

create table if not exists encounter_combatants (
  id              uuid primary key default uuid_generate_v4(),
  encounter_id    uuid not null references encounters(id) on delete cascade,

  kind            text not null check (kind in ('character', 'monster')),
  ref_id          uuid,                              -- characters.id / monsters.id (null when ad-hoc)
  name            text not null,                    -- snapshot for the log

  initiative      int  not null default 0,
  initiative_mod  int  not null default 0,
  turn_order      int  not null default 0,          -- 0-indexed slot in the order
  has_acted       boolean not null default false,

  joined_at       timestamptz not null default now(),
  unique (encounter_id, kind, ref_id)
);

create index if not exists idx_combatants_encounter on encounter_combatants (encounter_id);
create index if not exists idx_combatants_turn_order on encounter_combatants (encounter_id, turn_order);

-- Permissive RLS for local dev (mirrors the rest of the schema).
alter table encounters enable row level security;
alter table encounter_combatants enable row level security;
drop policy if exists "encounters_dev_all" on encounters;
drop policy if exists "combatants_dev_all" on encounter_combatants;
create policy "encounters_dev_all" on encounters for all using (true) with check (true);
create policy "combatants_dev_all" on encounter_combatants for all using (true) with check (true);

-- Enable Realtime publication so the frontend can subscribe to row changes
-- on these tables. supabase_realtime is the default publication created by
-- the Supabase CLI / managed service.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table encounters;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table encounter_combatants;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Touch updated_at on each encounter write so the panel can show "last edited".
create or replace function set_encounters_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_encounters_updated_at on encounters;
create trigger trg_encounters_updated_at
  before update on encounters
  for each row execute function set_encounters_updated_at();
