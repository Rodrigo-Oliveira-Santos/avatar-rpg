-- ============================================================
-- Avatar RPG — Promote status_effects to its own column
--
-- Why: the previous shape stored the array inside `equipment_data` JSONB.
-- Whenever AutoSave persisted a player's full character row, it overwrote
-- the GM's status_effects edits with the stale in-memory snapshot.
--
-- Solution: separate column updated independently from `equipment_data`.
-- AutoSave now writes everything *except* status_effects; the GM
-- StatusEffectManager writes only this column.
-- ============================================================

alter table characters
  add column if not exists status_effects jsonb not null default '[]';

-- Backfill from the legacy JSONB path so existing rows keep their effects.
update characters
   set status_effects = coalesce(equipment_data -> 'status_effects', '[]'::jsonb)
 where status_effects = '[]'::jsonb
   and equipment_data ? 'status_effects';

-- Strip the duplicate copy from equipment_data so we have a single source
-- of truth going forward.
update characters
   set equipment_data = equipment_data - 'status_effects'
 where equipment_data ? 'status_effects';

create index if not exists idx_characters_status_effects on characters using gin (status_effects);
