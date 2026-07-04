-- ============================================================
-- Avatar RPG — Persistent vitals + characters realtime
--
-- Adds dedicated columns for the player's current HP/CP/SP. Until now
-- these were recomputed at session start (max stats) so any GM-side HP
-- adjustment was ephemeral. With dedicated columns:
--   - both the player's own sheet and the GM Control panel write here
--     via targeted UPDATEs (no full-row AutoSave race),
--   - Supabase Realtime propagates changes to every connected browser.
--
-- `characters` itself is added to the realtime publication so the Hub /
-- GMControlPage can subscribe to HP changes without polling.
-- ============================================================

alter table characters
  add column if not exists hp_current int,
  add column if not exists cp_current int,
  add column if not exists sp_current int;

-- Add `characters` to the supabase_realtime publication (idempotent).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table characters;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
