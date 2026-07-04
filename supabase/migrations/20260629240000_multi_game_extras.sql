-- ============================================================
-- Multi-game extras (2026-06-29 part 2)
--   • D&D multiclass: jsonb array `classes` em `dnd_characters`
--     (cada entrada: { class, subclass, level }). A coluna escalar
--     `class` mantém-se para compatibilidade — passa a guardar a
--     classe principal (primeira do array).
--   • D&D campos em falta do modelo runtime (subclass escalar, gold,
--     hp_temp, hit_dice_total/used, age, gender) para que o
--     round-trip Supabase ↔ DnDCharacter não perca dados.
--   • Minecraft builds ganham `video_url` e `social_url` opcionais
--     (links YouTube/Instagram exibidos como ícones na vista de detalhe).
-- ============================================================

alter table dnd_characters
  add column if not exists classes jsonb default '[]'::jsonb,
  add column if not exists subclass text,
  add column if not exists gold int not null default 0,
  add column if not exists hp_temp int not null default 0,
  add column if not exists hit_dice_total int not null default 1,
  add column if not exists hit_dice_used int not null default 0,
  add column if not exists age text,
  add column if not exists gender text;

-- Backfill: para fichas existentes, materializa o array a partir da
-- coluna escalar `class` (se preenchida).
update dnd_characters
   set classes = jsonb_build_array(
         jsonb_build_object('class', class, 'subclass', null, 'level', level)
       )
 where classes = '[]'::jsonb
   and class is not null;

alter table mc_builds
  add column if not exists video_url   text,
  add column if not exists social_url  text;
