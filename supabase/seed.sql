-- Avatar RPG — Seed file
-- Re-runnable: every row uses a fixed UUID + `on conflict (id) do update set …`
-- so `npx supabase db reset` (or repeated `psql -f`) lands on a deterministic state.
--
-- Populates:
--   • 5 player users + admin + gm
--   • 5 fully-fleshed characters (identidade, atributos, skills_data, inventory_data, equipment_data)
--   • 12 demo items, 8 of which are listed in the shop

-- ============================================================
-- Users
-- ============================================================
insert into users (id, username, role) values
  ('00000000-0000-0000-0000-00000000a001', 'admin',  'admin'),
  ('00000000-0000-0000-0000-00000000a002', 'gm',     'gm'),
  ('00000000-0000-0000-0000-00000000a003', 'zuko',   'player'),
  ('00000000-0000-0000-0000-00000000a004', 'katara', 'player'),
  ('00000000-0000-0000-0000-00000000a005', 'toph',   'player'),
  ('00000000-0000-0000-0000-00000000a006', 'aang',   'player'),
  ('00000000-0000-0000-0000-00000000a007', 'sokka',  'player')
on conflict (username) do update set
  role = excluded.role;

-- ============================================================
-- Items (test catalogue)
-- ============================================================
insert into items (id, name, description, type, rarity, price, weight_class, defense_bonus, dodge_penalty, attributes, in_shop)
values
  ('00000000-0000-0000-0000-0000000b0001', 'Espada de Aço Comum',     'Lâmina equilibrada de aço temperado.',                      'weapon',     'common',     120,  'medium', 0, 0, '{"FOR": 1}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0002', 'Adaga das Sombras',        'Punhal leve, ideal para ataques rápidos.',                  'weapon',     'rare',       260,  'light',  0, 0, '{"AGI": 2}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0003', 'Bumerangue do Sokka',      'Bumerangue de osso polido. Volta sempre.',                  'weapon',     'epic',       480,  'light',  0, 0, '{"PER": 2, "AGI": 1}'::jsonb, false),
  ('00000000-0000-0000-0000-0000000b0004', 'Armadura de Couro',        'Proteção leve, sem comprometer a mobilidade.',              'armor',      'common',     150,  'light',  3, 0, '{}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0005', 'Cota da Tribo da Água',    'Cota tecida com fibras congeladas.',                        'armor',      'rare',       340,  'medium', 5, 1, '{"RES": 1}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0006', 'Armadura Imperial de Fogo','Forjada nos vulcões da Nação do Fogo.',                     'armor',      'epic',       720,  'heavy',  8, 2, '{"RES": 2, "FOR": 1}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0007', 'Amuleto do Avatar',        'Permite uma reroll de iniciativa por sessão.',              'accessory',  'legendary',  1500, 'light',  0, 0, '{"ESP": 3, "CHI": 2}'::jsonb, false),
  ('00000000-0000-0000-0000-0000000b0008', 'Bracelete de Jade',        '+1 esquiva passiva enquanto equipado.',                     'accessory',  'rare',       300,  'light',  0, 0, '{"AGI": 1, "PER": 1}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b0009', 'Poção de Chi Menor',       'Restaura 2d6 de chi.',                                      'consumable', 'common',     45,   'light',  0, 0, '{}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b000a', 'Poção de Cura',            'Restaura 3d6 + 5 de HP.',                                   'consumable', 'common',     60,   'light',  0, 0, '{}'::jsonb, true),
  ('00000000-0000-0000-0000-0000000b000b', 'Pergaminho — Rajada de Ar','Permite usar a habilidade Rajada de Ar uma vez.',           'consumable', 'rare',       180,  'light',  0, 0, '{}'::jsonb, false),
  ('00000000-0000-0000-0000-0000000b000c', 'Lanterna do Espírito',     'Ilumina presenças espirituais. Funciona em qualquer terreno.','other',    'epic',       550,  'light',  0, 0, '{"ESP": 1}'::jsonb, false)
on conflict (name) do update set
  description    = excluded.description,
  type           = excluded.type,
  rarity         = excluded.rarity,
  price          = excluded.price,
  weight_class   = excluded.weight_class,
  defense_bonus  = excluded.defense_bonus,
  dodge_penalty  = excluded.dodge_penalty,
  attributes     = excluded.attributes,
  in_shop        = excluded.in_shop;

-- ============================================================
-- Characters
-- ============================================================
-- All JSONB blobs use the shape the frontend reads via `rowToCharacter`
-- (see public/js/api/character-mapper.js) so the UI sees real test data
-- the moment the user logs in.

insert into characters (
  id, user_id, name, element, subclass, level, xp, gold,
  attr_for, attr_agi, attr_chi, attr_per, attr_res, attr_esp,
  points_available, combat_path, non_bender_path,
  skills_data, inventory_data, equipment_data, status_effects
) values
  -- Zuko — Fogo
  (
    '00000000-0000-0000-0000-0000000c0001',
    '00000000-0000-0000-0000-00000000a003',
    'Zuko', 'fire', 'Raio Azul', 12, 340, 450,
    14, 12, 10, 9, 13, 8,
    0, 'precise', null,
    '{"fire-sp1a":{"active":true,"activeSubSkills":[]},"fire-cb1a":{"active":true,"activeSubSkills":[]},"fire-cb2a":{"active":true,"activeSubSkills":[]}}'::jsonb,
    '[{"id":"00000000-0000-0000-0000-0000000b0001","name":"Espada de Aço Comum","quantity":1}]'::jsonb,
    '{"equipamentos":{"armor":"00000000-0000-0000-0000-0000000b0006"},"moedas":{"fire":80,"water":0,"earth":0,"air":0},"scrolls":{},"itens":[],"skill_uses":{"fire-cb1a":24,"fire-cb2a":6}}'::jsonb,
    '[]'::jsonb
  ),
  -- Katara — Água
  (
    '00000000-0000-0000-0000-0000000c0002',
    '00000000-0000-0000-0000-00000000a004',
    'Katara', 'water', 'Dobra de Sangue', 14, 500, 320,
    8, 10, 15, 11, 9, 14,
    0, null, null,
    '{"water-sp1a":{"active":true,"activeSubSkills":[]},"water-sp2a":{"active":true,"activeSubSkills":[]},"water-cb1a":{"active":true,"activeSubSkills":[]}}'::jsonb,
    '[{"id":"00000000-0000-0000-0000-0000000b000a","name":"Poção de Cura","quantity":3}]'::jsonb,
    '{"equipamentos":{"armor":"00000000-0000-0000-0000-0000000b0005"},"moedas":{"fire":0,"water":120,"earth":0,"air":0},"scrolls":{},"itens":[],"skill_uses":{"water-sp1a":18}}'::jsonb,
    '[{"id":"regeneracao","type":"positive"}]'::jsonb
  ),
  -- Toph — Terra
  (
    '00000000-0000-0000-0000-0000000c0003',
    '00000000-0000-0000-0000-00000000a005',
    'Toph', 'earth', 'Dobra de Metal', 15, 200, 600,
    16, 9, 11, 14, 15, 8,
    3, 'brute', null,
    '{"earth-ag1a":{"active":true,"activeSubSkills":[]},"earth-cb1c":{"active":true,"activeSubSkills":[]},"earth-br3a":{"active":true,"activeSubSkills":[]}}'::jsonb,
    '[{"id":"00000000-0000-0000-0000-0000000b0008","name":"Bracelete de Jade","quantity":1}]'::jsonb,
    '{"equipamentos":{"accessory":"00000000-0000-0000-0000-0000000b0008"},"moedas":{"fire":0,"water":0,"earth":200,"air":0},"scrolls":{},"itens":[],"skill_uses":{"earth-cb1c":51,"earth-br3a":3}}'::jsonb,
    '[{"id":"escudo","type":"positive"}]'::jsonb
  ),
  -- Aang — Ar
  (
    '00000000-0000-0000-0000-0000000c0004',
    '00000000-0000-0000-0000-00000000a006',
    'Aang', 'air', 'Avatar', 18, 800, 150,
    10, 16, 14, 12, 9, 15,
    6, 'precise', null,
    '{"air-sp1a":{"active":true,"activeSubSkills":[]},"air-ag1a":{"active":true,"activeSubSkills":[]},"air-ag2a":{"active":true,"activeSubSkills":[]},"air-cb1a":{"active":true,"activeSubSkills":[]}}'::jsonb,
    '[{"id":"00000000-0000-0000-0000-0000000b0007","name":"Amuleto do Avatar","quantity":1},{"id":"00000000-0000-0000-0000-0000000b000b","name":"Pergaminho — Rajada de Ar","quantity":2}]'::jsonb,
    '{"equipamentos":{"accessory":"00000000-0000-0000-0000-0000000b0007"},"moedas":{"fire":10,"water":10,"earth":10,"air":50},"scrolls":{"air-cb1a":2},"itens":[],"skill_uses":{"air-ag1a":17,"air-ag2a":2}}'::jsonb,
    '[]'::jsonb
  ),
  -- Sokka — Sem Dobra (caminho weapons)
  (
    '00000000-0000-0000-0000-0000000c0005',
    '00000000-0000-0000-0000-00000000a007',
    'Sokka', 'none', 'Estrategista', 10, 100, 800,
    12, 13, 8, 15, 11, 8,
    0, null, 'weapons',
    '{"none-weapons-cb1a":{"active":true,"activeSubSkills":[]},"none-weapons-cb1b":{"active":true,"activeSubSkills":[]}}'::jsonb,
    '[{"id":"00000000-0000-0000-0000-0000000b0003","name":"Bumerangue do Sokka","quantity":1},{"id":"00000000-0000-0000-0000-0000000b0002","name":"Adaga das Sombras","quantity":1},{"id":"00000000-0000-0000-0000-0000000b0009","name":"Poção de Chi Menor","quantity":2}]'::jsonb,
    '{"equipamentos":{"weapon":"00000000-0000-0000-0000-0000000b0003","armor":"00000000-0000-0000-0000-0000000b0004"},"moedas":{"fire":0,"water":40,"earth":0,"air":0},"scrolls":{},"itens":[],"skill_uses":{}}'::jsonb,
    '[{"id":"concentrado","type":"positive"}]'::jsonb
  )
on conflict (id) do update set
  name             = excluded.name,
  element          = excluded.element,
  subclass         = excluded.subclass,
  level            = excluded.level,
  xp               = excluded.xp,
  gold             = excluded.gold,
  attr_for         = excluded.attr_for,
  attr_agi         = excluded.attr_agi,
  attr_chi         = excluded.attr_chi,
  attr_per         = excluded.attr_per,
  attr_res         = excluded.attr_res,
  attr_esp         = excluded.attr_esp,
  points_available = excluded.points_available,
  combat_path      = excluded.combat_path,
  non_bender_path  = excluded.non_bender_path,
  skills_data      = excluded.skills_data,
  inventory_data   = excluded.inventory_data,
  equipment_data   = excluded.equipment_data,
  status_effects   = excluded.status_effects;

-- ============================================================
-- Monsters (demo catalogue)
-- ============================================================
-- Three throwaway examples so the GM tab is not empty after a reset.
-- All idempotent via stable UUIDs + `on conflict (id) do update set …`.

insert into monsters (
  id, name, level,
  hp_current, hp_max, defense, dodge,
  attr_for, attr_agi, attr_chi, attr_per, attr_res, attr_esp,
  attacks, loot_table, status_effects, notes, is_staged
) values
  -- Bandido das Estradas — encontro de baixo nível
  (
    '00000000-0000-0000-0000-0000000d0001',
    'Bandido das Estradas', 3,
    24, 24, 12, 11,
    11, 12, 8, 10, 9, 8,
    '[
      {"id":"a1","name":"Adaga rápida","damage":"1d6+2","range":"corpo a corpo","effect":""},
      {"id":"a2","name":"Atirar pedra","damage":"1d4","range":"9m","effect":""}
    ]'::jsonb,
    '[
      {"kind":"item","item_id":"00000000-0000-0000-0000-0000000b0002","quantity":1,"drop_rate":0.4},
      {"kind":"custom","name":"Bolsa de ouro","quantity":1,"drop_rate":1.0}
    ]'::jsonb,
    '[]'::jsonb,
    'Encontros típicos nas estradas das colónias da terra. Cobardes em desvantagem numérica.',
    false
  ),
  -- Espírito Maligno — encontro espiritual mediano
  (
    '00000000-0000-0000-0000-0000000d0002',
    'Espírito Maligno', 8,
    62, 62, 16, 13,
    8, 14, 16, 13, 10, 18,
    '[
      {"id":"a1","name":"Toque drenante","damage":"2d6 chi","range":"corpo a corpo","effect":"Fatigado"},
      {"id":"a2","name":"Sussurro do além","damage":"—","range":"6m","effect":"Aterrorizado (1 turno)"}
    ]'::jsonb,
    '[
      {"kind":"custom","name":"Fragmento espiritual","quantity":1,"drop_rate":1.0},
      {"kind":"item","item_id":"00000000-0000-0000-0000-0000000b0007","quantity":1,"drop_rate":0.1}
    ]'::jsonb,
    '[{"id":"invisivel","type":"positive"}]'::jsonb,
    'Imune a ataques físicos não-espirituais.',
    false
  ),
  -- Capitão Imperial — boss de campanha
  (
    '00000000-0000-0000-0000-0000000d0003',
    'Capitão Imperial', 14,
    150, 150, 22, 9,
    18, 10, 14, 12, 17, 11,
    '[
      {"id":"a1","name":"Espada em chamas","damage":"3d8 + 1d6 fogo","range":"corpo a corpo","effect":"Queimadura"},
      {"id":"a2","name":"Comando de fogo","damage":"4d6 área","range":"12m, cone 6m","effect":""},
      {"id":"a3","name":"Defesa de comandante","damage":"—","range":"passiva","effect":"+4 defesa enquanto há aliados em 6m"}
    ]'::jsonb,
    '[
      {"kind":"item","item_id":"00000000-0000-0000-0000-0000000b0006","quantity":1,"drop_rate":1.0},
      {"kind":"item","item_id":"00000000-0000-0000-0000-0000000b0001","quantity":1,"drop_rate":1.0},
      {"kind":"custom","name":"Insígnia da Nação do Fogo","quantity":1,"drop_rate":1.0}
    ]'::jsonb,
    '[]'::jsonb,
    'Elite. Comanda 1d4 soldados rasos em encontros.',
    false
  )
on conflict (id) do update set
  name           = excluded.name,
  level          = excluded.level,
  hp_current     = excluded.hp_current,
  hp_max         = excluded.hp_max,
  defense        = excluded.defense,
  dodge          = excluded.dodge,
  attr_for       = excluded.attr_for,
  attr_agi       = excluded.attr_agi,
  attr_chi       = excluded.attr_chi,
  attr_per       = excluded.attr_per,
  attr_res       = excluded.attr_res,
  attr_esp       = excluded.attr_esp,
  attacks        = excluded.attacks,
  loot_table     = excluded.loot_table,
  status_effects = excluded.status_effects,
  notes          = excluded.notes,
  is_staged        = excluded.is_staged;
