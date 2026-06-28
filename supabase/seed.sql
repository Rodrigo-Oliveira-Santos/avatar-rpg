-- Avatar RPG — Seed file
-- Populated when running `npx supabase db reset` (or once after `supabase start`).
-- Includes the same test profiles the frontend uses in localStorage bypass mode.

insert into users (id, username, role) values
  ('00000000-0000-0000-0000-00000000a001', 'admin',  'admin'),
  ('00000000-0000-0000-0000-00000000a002', 'gm',     'gm'),
  ('00000000-0000-0000-0000-00000000a003', 'zuko',   'player'),
  ('00000000-0000-0000-0000-00000000a004', 'katara', 'player'),
  ('00000000-0000-0000-0000-00000000a005', 'toph',   'player'),
  ('00000000-0000-0000-0000-00000000a006', 'aang',   'player'),
  ('00000000-0000-0000-0000-00000000a007', 'sokka',  'player')
on conflict (username) do nothing;

insert into characters (user_id, name, element, level, gold, attr_for, attr_agi, attr_chi, attr_per, attr_res, attr_esp)
values
  ('00000000-0000-0000-0000-00000000a003', 'Zuko',   'fire',  12, 450, 14, 12, 10,  9, 13,  8),
  ('00000000-0000-0000-0000-00000000a004', 'Katara', 'water', 14, 320,  8, 10, 15, 11,  9, 14),
  ('00000000-0000-0000-0000-00000000a005', 'Toph',   'earth', 15, 600, 16,  9, 11, 14, 15,  8),
  ('00000000-0000-0000-0000-00000000a006', 'Aang',   'air',   18, 150, 10, 16, 14, 12,  9, 15),
  ('00000000-0000-0000-0000-00000000a007', 'Sokka',  'none',  10, 800, 12, 13,  8, 15, 11,  8)
on conflict do nothing;
