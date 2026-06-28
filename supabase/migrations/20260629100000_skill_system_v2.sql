-- ============================================================
-- Avatar RPG — Expand skill system to match canonical HTML trees
--
-- Adds the missing fields needed to represent the data documented in
-- docs/*_skill_tree.html (5 tiers including Legendary, 5 branches with
-- shared/exclusive flows, mastery system, position metadata, and the
-- chiblocker / weapons sub-paths for non-benders).
--
-- Safe to re-run: every change uses IF NOT EXISTS / IF EXISTS guards.
-- ============================================================

-- ----------------------------------------------------------------
-- skills: widen schema
-- ----------------------------------------------------------------

-- 1) tier: allow legendary (5)
alter table skills drop constraint if exists skills_tier_check;
alter table skills add  constraint skills_tier_check check (tier between 1 and 5);

-- 2) category: allow shared 'combat' tier (N1-N2 nodes that branch into precise/brute at N3)
alter table skills drop constraint if exists skills_category_check;
alter table skills add  constraint skills_category_check
  check (category in ('spirit','agility','combat','precise','brute'));

-- 3) branch (sp|ag|cb|pr|br) — visual/structural classifier from the trees
alter table skills add column if not exists branch text
  check (branch in ('sp','ag','cb','pr','br'));

-- 4) non_bender_path — only meaningful when element='none'
alter table skills add column if not exists non_bender_path text
  check (non_bender_path in ('chiblocker','weapons'));

-- 5) tier_label (e.g. 'Espírito N1', 'Lendário — Bruto')
alter table skills add column if not exists tier_label text;

-- 6) damage_summary (e.g. '1d6 chi/turno', '4d10 + Choque')
alter table skills add column if not exists damage_summary text;

-- 7) requirements_text — free-form prerequisite description from the design
alter table skills add column if not exists requirements_text text;

-- 8) mastery_levels: [M0, M1, M2, M3] strings (one per mastery tier)
alter table skills add column if not exists mastery_levels jsonb;

-- 9) position: { column, y_offset } — drives the canvas layout
alter table skills add column if not exists position_meta jsonb;

-- 10) is_legendary boolean (denormalized for fast filter)
alter table skills add column if not exists is_legendary boolean not null default false;

-- The legacy `unique (element, name)` constraint is still good but does
-- not distinguish the two non-bender paths sharing names. Drop it and
-- replace with a composite that includes non_bender_path.
alter table skills drop constraint if exists skills_element_name_key;
create unique index if not exists skills_unique_per_path
  on skills (element, coalesce(non_bender_path, ''), name);

-- ----------------------------------------------------------------
-- characters: combat path lock + non-bender choice
-- ----------------------------------------------------------------
alter table characters add column if not exists combat_path text
  check (combat_path in ('precise','brute'));

alter table characters add column if not exists non_bender_path text
  check (non_bender_path in ('chiblocker','weapons'));

-- ----------------------------------------------------------------
-- character_skills: mastery system (M0..M3 driven by use count)
-- ----------------------------------------------------------------
alter table character_skills add column if not exists uses int not null default 0;
alter table character_skills add column if not exists mastery_level int not null default 0
  check (mastery_level between 0 and 3);

create index if not exists idx_skills_element_branch on skills (element, branch);
create index if not exists idx_skills_non_bender_path on skills (non_bender_path)
  where non_bender_path is not null;
