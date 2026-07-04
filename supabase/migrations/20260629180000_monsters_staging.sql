-- ============================================================
-- Avatar RPG — Monsters: staging vs in-battle + cemetery
--
-- - Rename `in_play` to `is_staged` (selected for the next battle).
--   The actual "is fighting right now" lives in `encounters` /
--   `encounter_combatants`, so the staging flag becomes a simple
--   wishlist the GM curates before clicking "Iniciar batalha".
-- - Add `is_dead` so the GM can keep historical monsters in the
--   catalogue (cemetery) without them showing up in selection lists.
-- ============================================================

alter table monsters rename column in_play to is_staged;

-- Recreate index with the new name.
drop index if exists idx_monsters_in_play;
create index if not exists idx_monsters_is_staged on monsters (is_staged) where is_staged = true;

alter table monsters add column if not exists is_dead boolean not null default false;
create index if not exists idx_monsters_is_dead on monsters (is_dead) where is_dead = true;
