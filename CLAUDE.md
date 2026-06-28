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
| skills | js/skills/ | Skill tree, cards, sub-skills UI, slot limits display |
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
