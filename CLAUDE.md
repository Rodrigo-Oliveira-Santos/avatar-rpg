# Avatar RPG — Claude Code Context

**Updated:** 2026-06-26

## Stack
- Frontend: HTML5 + CSS3 + JS ES6 modules (no framework)
- Backend: Netlify Functions + Supabase (PostgreSQL)
- Current mode: localStorage by default; optional Supabase persistence via `public/config.js` (`useSupabase: true`) or `?supabase=1`
- Hosting: Netlify free tier

## Status: Phases 1-6 Complete + GM/UX patch

All core features implemented. Remaining: companions system + Supabase Auth integration.

Recent changes (2026-06-26 patch):
- Separate MAX buttons for HP/SP/CP
- Players can no longer self-grant XP — GM-only
- Dodge capped at 15; configurable `STAT_CAPS` for HP/SP/CP/Defense
- Nation coins usable across all elements
- GM/Admin lose the character/skill/items tabs
- Hub for GM lists all registered players (even without saved characters)
- Supabase CLI local persistence path wired up (opt-in)

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| auth | js/auth/ | AuthManager, login, roles (player/gm/admin) |
| character | js/character/ | Character class, stats, XP, level-up, subclasses, slots |
| skills | js/skills/ | Skill tree, cards, sub-skills UI, slot limits, mastery (M0-M3), 5 tiers, branches (sp/ag/cb/pr/br) |
| items | js/items/ | InventoryPage, equip/unequip, scrolls |
| shop | js/shop/ | Shop page, data (mock + imported), dual-currency pricing |
| hub | js/hub/ | Player hub, CharacterModal, GroupRewards, LootDelivery, GiftTransfer |
| import | js/import/ | GM JSON import (validators, storage, ImportPage) |
| trade | js/trade/ | TradeManager, TradeModal, notifications |
| admin | js/admin/ | AdminPanel, BackupRestore, LogService, LogViewer |
| storage | js/storage/ | AutoSave, export/import character JSON |
| api | js/api/ | HTTP client, auth, characters, skills, items endpoints |
| utils | js/utils/ | DOM helpers, constants (NATION_CURRENCIES, RARITY_BONUSES), toast |
| combat | js/combat/ | Dice, resolver, status effects |

## Key Patterns

- Role check: `authManager.hasRole('gm')` (hierarchy: player < gm < admin)
- Per-user storage: `avatar_rpg_character_{username}`
- Imported data: `avatar_rpg_imported_skills_{element}`, `avatar_rpg_imported_items`
- User registry: `avatar_rpg_users_registry`
- Trades: `avatar_rpg_trades`
- Logs: `avatar_rpg_system_logs`
- Data priority: API > localStorage imported > mock
- Tests: `npm test` (vitest, 101 unit tests on game logic)

## Formulas

- HP: 10 + (nivel × 8) + (FOR × 3)
- Chi: 6 + (nivel × 5) + (CHI × 4)
- Spirit: 8 + (nivel × 6) + (ESP × 3)
- Defense: (RES × 2) + nivel + armor_bonus
- Dodge: 10 + ((AGI × 2) + PER) × 0.2 - armor_penalty
- XP next: round(200 × (nivel-1)^1.55)
- Points/level: 3, Max level: 40
- Mastery thresholds: M1=15, M2=50, M3=150 uses (`MASTERY_THRESHOLDS`)

## Skill system v2 (2026-06-29)

Source of truth: `docs/*_skill_tree.html` → extracted to `data/skills/*.json` via `scripts/extract-skill-trees.mjs`.

- **5 tiers** (1..5; 5 = Lendário). **5 branches** per element:
  - `sp` Espírito, `ag` Agilidade — always available
  - `cb` Combate (tiers 1-2 partilhados)
  - `pr` Preciso, `br` Bruto — **mutually exclusive at tier 3+**; locked via `character.combat_path`
- **`element='none'`** splits into two paths via `character.non_bender_path`: `chiblocker` or `weapons` (separate trees in `data/skills/none-{chiblocker,weapons}.json`)
- **Mastery** automatically progresses from M0 to M3 based on uses. `character.recordSkillUse(id)` + `character.getMasteryLevel(id)`.
- Persisted in `characters.combat_path` / `characters.non_bender_path` + `character_skills.uses`/`mastery_level` (Supabase migration `20260629100000_skill_system_v2.sql`).
- Import JSON schema: `skill-import-v2` (see DIAGRAMAS-TÉCNICOS §9.1).

## Roles

| Role | Access |
|------|--------|
| player | Own character, shop, trade |
| gm | + All characters, give gold/XP/loot, import JSON, group rewards |
| admin | + User management, backup/restore, logs, promote/demote |

## File Structure

```text
public/
├── index.html
├── css/ (main.css + components/*.css)
└── js/ (main.js + app.js + modules above)
netlify/functions/ (serverless API — not active in bypass mode)
supabase/ (schema.sql — not active in bypass mode)
```

## Docs

- FEATURES.md — All pages and mechanics (human-readable)
- DIAGRAMAS-NÃO-TÉCNICOS.md — Game flows and mechanics
- DIAGRAMAS-TÉCNICOS.md — Architecture, DB schema, API specs, JSON import schemas
- DEV-LOCAL.md — Local dev setup

## Doc Update Rules

After implementing a new phase/feature set:
- Update FEATURES.md (status + details)
- Update README.md (phases table + details)
- Update this file + copilot-instructions.md (keep concise, modules table, status line)
- Delete docs that become redundant

## Working Style

- Ask clarifying questions before implementing when design decisions have multiple valid options
- Prefer multiple choice questions for faster decisions
- Don't assume — confirm scope, behavior, and edge cases when ambiguous

## Futuro (Backlog)

- Companheiros com stats próprios e progressão
- Integração Supabase (migração localStorage → BD)
