-- ============================================================
-- Avatar RPG — Notes (player + GM)
--
-- Two parallel arrays of timestamped notes on each character:
--   - `player_notes`: own notes (player adds/edits/deletes)
--   - `gm_notes`:     GM's notes about that character (GM-only)
--
-- Each note shape: { id, text, created_at, updated_at? }
-- ============================================================

alter table characters add column if not exists player_notes jsonb not null default '[]';
alter table characters add column if not exists gm_notes     jsonb not null default '[]';
