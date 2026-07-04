-- ============================================================
-- Avatar RPG — Monster chi pool
--
-- The 2026-06-30 combat tweaks introduced an "every 2 rounds, all
-- combatants regen +20 chi" rule (see `public/js/combat/regen.js`).
-- Players already have a chi pool via the `characters.cp_current`
-- column; monsters did not. Without these columns we'd have to
-- silently skip them, which contradicts the design ("todos os
-- jogadores e monstros").
--
-- We keep both columns NULLABLE so existing monster rows (and GM
-- workflows that don't care about chi for a given creature) just
-- stay opted out: regen only fires when `cp_max IS NOT NULL`.
-- ============================================================

alter table monsters
  add column if not exists cp_max     int,
  add column if not exists cp_current int;

-- Enforce non-negative values when present.
alter table monsters
  drop constraint if exists monsters_cp_max_nonneg;
alter table monsters
  add constraint monsters_cp_max_nonneg
  check (cp_max is null or cp_max >= 0);

alter table monsters
  drop constraint if exists monsters_cp_current_nonneg;
alter table monsters
  add constraint monsters_cp_current_nonneg
  check (cp_current is null or cp_current >= 0);
