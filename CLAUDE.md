# Avatar RPG — Claude Code Context

**Updated:** 2026-06-30

## Stack
- Frontend: HTML5 + CSS3 + JS ES6 modules (no framework)
- Backend: Netlify Functions + Supabase (PostgreSQL) + Supabase Realtime
- Default: localStorage; opt-in Supabase persistence via `public/config.js` (`useSupabase: true`) or `?supabase=1`
- Hosting: Netlify free tier
- **Cross-Origin Isolation** enabled via `public/serve.json` (dev) + `netlify.toml` (prod) so the Godot map iframe in the Hub can use SharedArrayBuffer.

## Status: Phases 1-6 + GM tooling + Combat-by-turns + Cross-browser trades + GM delegated modals + Hub map

All core features implemented. Remaining: companions + Supabase Auth + cooldown engine + automated combat resolution.

Recent (2026-06-30):
- **GM Control delegated modals** — `PlayerShopModal` (buy-for-player), `PlayerInventoryModal` (equip/unequip/use), `PlayerSkillsModal` (skill tree). Player name + 👤 opens read-only `CharacterModal`. `💰 Recompensas em Grupo` + `🎁 Entregar Loot` no header (reused from Hub).
- **Admin delete account** — `🗑 Apagar` button with self/last-admin guards; cascade users + cleanup orphan trades.
- **Hub Avatar map** — Godot iframe (`html.itch.zone/html/8396265/`) cached per instance + collapse toggle. Requires COI headers; supabase-js loader moved to jsdelivr (sends CORP).
- **Lazy non-bender path picker** — no longer fires on login; appears when user opens the Sem Dobra tab and is dismissable. Preview tabs let players inspect both trees before committing.
- **Bug fixes:** stale character name on re-login (Character.reset on teardown + brand-new account bootstrap); missing `ouro` in `rowToCharacter`; `openCharacterModal` now Supabase-aware.
- **New helper `api/gm-characters.js`** — Supabase-first load/save/list/delete for cross-user operations; used by every GM tool.

Previous (2026-06-29):
- **Encounters** + EncounterPanel + status-effect tick engine + player-side `endOwnTurn`.
- **Persistência cirúrgica**: colunas `hp_current/cp_current/sp_current/status_effects/player_notes/gm_notes` em `characters`.
- **Trades cross-browser** com Realtime + histórico no perfil.
- **Loja GM**: modo Gerir + `shop_profiles` (bundles).
- **Notas duplas** (jogador + GM).
- `.btn` system + `createElement` aria-fix + modal-overlay opacity fix.

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| auth | js/auth/ | AuthManager, login, roles (player/gm/admin) |
| character | js/character/ | Character class, stats, XP, level-up, subclasses, slots, AttributeStrip, NotesEditor |
| skills | js/skills/ | Skill tree, cards, sub-skills UI, slot limits, mastery (M0-M3), 5 tiers, branches (sp/ag/cb/pr/br), SkillPanel. PathPicker lazy + dismissable + preview tabs for Sem Dobra |
| items | js/items/ | InventoryPage, equip/unequip, scrolls |
| shop | js/shop/ | Shop page (player view + ShopManager CRUD para GM), data (Supabase + imported + mock), dual-currency pricing |
| hub | js/hub/ | Player hub (mapa interativo no topo, depois jogadores, depois ferramentas), CharacterModal, GroupRewards, LootDelivery, GiftTransfer, StatusEffectManager, EncounterPanel mount, in-battle monster overlay |
| monsters | js/monsters/ | MonstersPage (3 colunas: staged/biblioteca/cemitério), persistence via api/monsters, BattleLauncher trigger |
| gm-control | js/gm-control/ | GMControlPage (dashboard único) + delegated modals: PlayerShopModal, PlayerInventoryModal, PlayerSkillsModal. Header reuses GroupRewards + LootDelivery from Hub |
| combat | js/combat/ | Dice (rollExpression + promptRoll com manual/auto toggle), EncounterPanel, BattleLauncher, statusTicks, resolver (legacy), status (legacy) |
| import | js/import/ | GM JSON import (validators, storage, ImportPage) |
| trade | js/trade/ | TradeManager, TradeModal, notifications |
| admin | js/admin/ | AdminPanel (role changes + 🗑 delete account), BackupRestore, LogService, LogViewer |
| storage | js/storage/ | AutoSave (debounced; `flush()` on logout; passa `omitStatusEffects`+`omitGmNotes`+`omitVitals` para Supabase) |
| api | js/api/ | auth, characters, skills, items, monsters, encounters, notifications, **gm-characters** (cross-user load/save/list/delete, Supabase-first) — todos com fallback localStorage |
| utils | js/utils/ | DOM helpers, constants (NATION_CURRENCIES, RARITY_BONUSES), toast (× per toast + Limpar tudo), statusEffects catalog (com damage_per_turn/tick_when/duration) |

## Key Patterns

- Role check: `authManager.hasRole('gm')` (hierarchy: player < gm < admin)
- Per-user storage: `avatar_rpg_character_{username}`
- Imported data: `avatar_rpg_imported_skills_{element}`, `avatar_rpg_imported_items`
- User registry: `avatar_rpg_users_registry`
- Trades: `avatar_rpg_trades`
- Logs: `avatar_rpg_system_logs`
- Data priority: API > localStorage imported > mock
- Tests: `npm test` (vitest, 200 unit tests on game logic)

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

Source of truth: `docs/skill-trees/*.html` → extracted to `data/skills/*.json` via `scripts/extract-skill-trees.mjs`.

- **5 tiers** (1..5; 5 = Lendário). **5 branches** per element:
  - `sp` Espírito, `ag` Agilidade — always available
  - `cb` Combate (tiers 1-2 partilhados)
  - `pr` Preciso, `br` Bruto — **mutually exclusive at tier 3+**; locked via `character.combat_path`
- **`element='none'`** splits into two paths via `character.non_bender_path`: `chiblocker` or `weapons` (separate trees in `data/skills/none-{chiblocker,weapons}.json`)
- **Mastery** automatically progresses from M0 to M3 based on uses. `character.recordSkillUse(id)` + `character.getMasteryLevel(id)`.
- Persisted in `characters.combat_path` / `characters.non_bender_path` + `character_skills.uses`/`mastery_level` (Supabase migration `20260629100000_skill_system_v2.sql`).
- Import JSON schema: `skill-import-v2` (see `docs/DIAGRAMAS-TECNICOS.md` §9.1).

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
├── config.js               (Supabase config; gitignored)
├── serve.json              (COI headers for `serve` dev server)
├── css/ (main.css + components/*.css)
└── js/ (main.js + app.js + modules above)
netlify/functions/ (serverless API — not active in bypass mode)
supabase/
├── migrations/             (canonical schema; apply via `npx supabase db reset`)
├── seed.sql                (deterministic test data)
└── schema.sql              (legacy snapshot, kept for reference)
data/skills/                (per-element skill JSONs, source for the trees)
scripts/                    (extract-skill-trees.mjs etc.)
docs/                       (all markdown documentation lives here)
├── FEATURES.md
├── DECISIONS.md
├── DEV-LOCAL.md
├── DIAGRAMAS-TECNICOS.md
├── DIAGRAMAS-NAO-TECNICOS.md
└── skill-trees/            (HTML originals: fire.html, water.html, …)
```

## Docs

All long-form docs live under `docs/` (root keeps only `README.md`, `CLAUDE.md`, `.github/copilot-instructions.md`):

- `docs/FEATURES.md` — All pages and mechanics (human-readable)
- `docs/DECISIONS.md` — Applied/pending design decisions
- `docs/DIAGRAMAS-NAO-TECNICOS.md` — Game flows and mechanics
- `docs/DIAGRAMAS-TECNICOS.md` — Architecture, DB schema, API specs, JSON import schemas
- `docs/DEV-LOCAL.md` — Local dev setup
- `docs/skill-trees/*.html` — Source-of-truth HTML for each element's skill tree (consumed by `scripts/extract-skill-trees.mjs`)

## Doc Update Rules

After implementing a new phase/feature set:
- Update `docs/FEATURES.md` (status + details)
- Update `README.md` (phases table + details)
- Update this file + `.github/copilot-instructions.md` (keep concise, modules table, status line)
- Delete docs that become redundant

## Working Style

- Ask clarifying questions before implementing when design decisions have multiple valid options
- Prefer multiple choice questions for faster decisions
- Don't assume — confirm scope, behavior, and edge cases when ambiguous

## Futuro (Backlog)

- Companheiros com stats próprios e progressão
- Integração Supabase (migração localStorage → BD)
