-- ============================================================
-- Avatar RPG — Trades (cross-browser, realtime)
--
-- Players can now propose / accept / reject trades with anyone in the
-- campaign, regardless of which browser is open. The GM also writes here
-- when forcing item / gold transfers via the Hub tools, so the player
-- ends up with a complete history of "what came in and went out".
--
-- Status machine:
--   pending  → accepted | rejected | cancelled
--   forced   ← terminal (GM action, no acceptance needed)
-- ============================================================

create table if not exists trades (
  id              uuid primary key default uuid_generate_v4(),
  from_username   text not null,
  to_username     text not null,

  offer_items     jsonb not null default '[]',
  offer_gold      int   not null default 0,
  request_items   jsonb not null default '[]',
  request_gold    int   not null default 0,

  status          text not null default 'pending'
                      check (status in ('pending', 'accepted', 'rejected', 'cancelled', 'forced')),
  kind            text not null default 'trade'
                      check (kind in ('trade', 'forced', 'loot', 'reward')),
  note            text,

  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);

create index if not exists idx_trades_pending_to   on trades (to_username)   where status = 'pending';
create index if not exists idx_trades_pending_from on trades (from_username) where status = 'pending';
create index if not exists idx_trades_history      on trades (created_at desc);

alter table trades enable row level security;
drop policy if exists "trades_dev_all" on trades;
create policy "trades_dev_all" on trades for all using (true) with check (true);

-- Add to realtime publication so the recipient sees a new proposal pop
-- up without a manual refresh.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table trades;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
