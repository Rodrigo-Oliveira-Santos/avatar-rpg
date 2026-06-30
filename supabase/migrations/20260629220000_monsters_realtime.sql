-- ============================================================
-- Avatar RPG — Add monsters to realtime publication
--
-- The MonstersPage and the Hub overlay both need to react to changes
-- (e.g. GM sends a monster to the cemetery from the Control panel; both
-- the catalogue tab and the Hub should update without a manual refresh).
-- ============================================================

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table monsters;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
