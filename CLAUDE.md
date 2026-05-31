# Avatar RPG — Claude Code Context

**Updated:** 2026-05-31

## Stack
- Frontend: HTML5 + CSS3 + JS ES6 modules (no framework)
- Backend: Netlify Functions + Supabase (PostgreSQL)
- Current mode: localStorage bypass (no Supabase active)
- Hosting: Netlify free tier

## Status: Phases 1-4 Complete

All core features implemented. Remaining work is "Futuro" backlog.

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| auth | js/auth/ | AuthManager, login, roles (player/gm/admin) |
| character | js/character/ | Character class, stats, XP, level-up |
| skills | js/skills/ | Skill tree, cards, data loader (API → imported → mock) |
| items | js/items/ | Inventory, equip/unequip |
| shop | js/shop/ | Shop page, data (mock + imported merged) |
| hub | js/hub/ | Player hub, CharacterModal, GroupRewards, LootDelivery |
| import | js/import/ | GM JSON import (validators, storage, ImportPage) |
| trade | js/trade/ | TradeManager, TradeModal, notifications |
| admin | js/admin/ | AdminPanel, BackupRestore, LogService, LogViewer |
| storage | js/storage/ | AutoSave, export/import character JSON |
| api | js/api/ | HTTP client, auth, characters, skills, items endpoints |
| utils | js/utils/ | DOM helpers, constants, toast/confirm/prompt dialogs |
| combat | js/combat/ | Dice, resolver, status effects |

## Key Patterns

- Role check: `authManager.hasRole('gm')` (hierarchy: player < gm < admin)
- Per-user storage: `avatar_rpg_character_{username}`
- Imported data: `avatar_rpg_imported_skills_{element}`, `avatar_rpg_imported_items`
- User registry: `avatar_rpg_users_registry`
- Trades: `avatar_rpg_trades`
- Logs: `avatar_rpg_system_logs`
- Data priority: API > localStorage imported > mock

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

## Futuro (Backlog)

- Moedas por nação
- Subclasses desbloqueáveis
- Companheiros com stats
- Página dedicada de inventário
- Raridade com mecânicas
- Gifts/trocas forçadas
