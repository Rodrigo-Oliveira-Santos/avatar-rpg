# Avatar RPG — Claude Code Context

**Updated:** 2026-06-29

## Stack
- Frontend: HTML5 + CSS3 + JS ES6 modules (no framework, no bundler)
- Backend: Netlify Functions + Supabase (PostgreSQL, opt-in)
- Current mode: localStorage by default; Supabase opt-in via `public/config.js` (`useSupabase: true`) or `?supabase=1`
- Hosting: Netlify free tier

## Status: Multi-game platform (Avatar + D&D + Minecraft)

Três apps independentes a partilhar landing, login overlay e persistência.

| App | Status | Tabs |
|-----|--------|------|
| Avatar | Phases 1-6 done | Personagem · Skills (×5) · Itens · Loja · Hub · Importar · Admin |
| D&D 5e | MVP done | Ficha · Perícias · Magias · Inventário · Trade · Hub · Importar |
| Minecraft | MVP done | Galeria · Painel Pessoal · Minhas Listas |

Mudanças recentes (2026-06-29):
- Multi-game platform: landing + router + per-game session isolation
  (`avatar_rpg_user` / `dnd_user` / `mc_user` — sem fallback cross-app)
- Single-game mode via `?game=<id>` (`npm run dev:avatar|dnd|minecraft`)
- D&D 5e: full sheet, multiclass simples, trade com pre-validation,
  pack import 4 domínios (spells / subclasses / magic items / races)
- Minecraft: galeria pública 2 vistas (grelha quadrada com detalhe
  opcional, lista detalhada), tags, links sociais (YT/IG),
  likes/dislikes tipo YouTube, playlists "Minhas Listas"
- Filtros galeria: pesquisa, categoria (com "Outro" = sem categoria),
  tag, ordenação por data/likes/dislikes
- Login overlay com brand+cor por jogo + botão "← Início" global
- `dnd-character-mapper.js` para round-trip Supabase ↔ runtime sem perdas
- 275 testes vitest

## Módulos

### Avatar (intacto nesta branch)
| Module | Path | Purpose |
|--------|------|---------|
| auth | js/auth/ | AuthManager Avatar |
| character | js/character/ | Character class, stats, XP, level-up, subclasses |
| skills | js/skills/ | Skill tree, cards, sub-skills |
| items | js/items/ | InventoryPage, equip/unequip |
| shop | js/shop/ | Loja multi-moeda |
| hub | js/hub/ | HubPage, CharacterModal, GroupRewards, LootDelivery |
| import | js/import/ | GM JSON import Avatar |
| trade | js/trade/ | TradeManager (Avatar) |
| admin | js/admin/ | AdminPanel, BackupRestore, LogService |
| storage | js/storage/ | AutoSave + export/import |
| combat | js/combat/ | Dice, resolver, status effects |
| api/characters,skills,items,auth | js/api/ | Existing Avatar APIs |

### Multi-game scaffolding
| File | Purpose |
|------|---------|
| js/router.js | Hash router (`#/<game>/<page>`) |
| js/main.js | Registra jogos, single-game mode, botão "← Início" global |
| js/games/landing/ | Game selector (público) |
| js/games/back-widget.js | "← Início" flutuante (oculto em single-game) |
| js/games/lib/shared-auth.js | Factory de auth p/ D&D+MC (brand+title+session) |

### D&D 5e
| File | Purpose |
|------|---------|
| games/dnd/index.js | Entry: tabs, autosave, GM rewards |
| games/dnd/data/srd.js | Tabelas SRD (skills, classes, races, XP) |
| games/dnd/dnd-character.js | Modelo + cálculos (mods, prof, saves, multiclass) |
| games/dnd/dnd-trade.js | State machine + pre-validation + applyTransfer |
| games/dnd/dnd-import.js | Validators + storage de 4 domínios |
| games/dnd/pages/ | Character, Skills, Spells, Inventory, Trade, Hub, Import |
| api/dnd-characters.js | CRUD (Supabase + localStorage fallback) |
| api/dnd-character-mapper.js | Flat row ↔ nested model (round-trip seguro) |

### Minecraft Builds
| File | Purpose |
|------|---------|
| games/minecraft/index.js | Entry: tabs Galeria/Painel/Listas |
| games/minecraft/lib/drive.js | Helpers Drive URL + probe assíncrono |
| games/minecraft/lib/social.js | Detect YT/IG/generic link |
| games/minecraft/components/reactions-bookmarks.js | Like/dislike + popover playlist |
| games/minecraft/pages/ | Gallery, MyPanel, BuildForm, Lists |
| api/mc-builds.js | CRUD builds (Supabase + localStorage) |
| api/mc-reactions.js | Like/dislike (localStorage; Supabase schema ready) |
| api/mc-lists.js | Playlists (localStorage; Supabase schema ready) |

## Key Patterns

- Role check: `authManager.hasRole('gm')` (player < gm < admin)
- Per-app storage namespaces (sem fallback cross-app):
  - `avatar_rpg_*` (auth, character, trades, logs, registry)
  - `dnd_*` (auth, character, trades, characters_registry, imported_*)
  - `mc_*` (auth, builds, reactions, lists_{username})
- Login overlay partilhado (`#login-overlay`) com brand contextual via
  CSS var `--login-accent` e logo dinâmico (`#login-logo`)
- Tests: `npm test` (vitest, **275 testes**)

## Fórmulas

**Avatar:**
- HP = 10 + (nivel × 8) + (FOR × 3)
- Chi = 6 + (nivel × 5) + (CHI × 4)
- Spirit = 8 + (nivel × 6) + (ESP × 3)
- Defense = (RES × 2) + nivel + armor_bonus
- Dodge = 10 + ((AGI × 2) + PER) × 0.2 - armor_penalty (cap 15)
- XP next = round(200 × (nivel-1)^1.55) — máx nível 40

**D&D 5e:**
- Modifier = floor((score − 10) / 2)
- Proficiency = ⌈level / 4⌉ + 1
- Save = ab_mod + (prof ? prof_bonus : 0)
- Skill = ab_mod + prof_bonus × (prof ? (expertise ? 2 : 1) : 0)
- Spell DC = 8 + prof + cast_ability_mod
- Multiclass level = soma dos níveis por classe
- XP table = standard 5e (0 → 355 000)

## Roles

| Role | Avatar | D&D | Minecraft |
|------|--------|-----|-----------|
| player | Own char, shop, trade | Own sheet, trade | Bookmark, react |
| gm | + All chars, give gold/XP/loot, import | + All sheets, give XP/gold, import packs | (sem privilégio extra) |
| admin | + Users, backup, logs | (igual GM) | Apagar qualquer build |

## Dev scripts

```bash
npm run dev            # multi-game (landing + 3 apps)
npm run dev:avatar     # só Avatar
npm run dev:dnd        # só D&D
npm run dev:minecraft  # só Minecraft
npm test               # 275 tests
```

## File Structure

```text
public/
├── index.html
├── css/ (main.css + components/*.css incl. dnd-sheet, mc-gallery)
└── js/
    ├── api/
    ├── games/landing,lib,back-widget.js
    ├── games/avatar/   (delega no App, intacto)
    ├── games/dnd/data,pages
    ├── games/minecraft/lib,pages,components
    └── (auth, character, skills, items, shop, hub, import, trade,
         admin, storage, combat, utils — Avatar)
supabase/migrations/
  20260101000000_init.sql
  20260628000000_relax_rls_pre_auth.sql
  20260629000000_multi_game.sql           # dnd_characters, mc_builds
  20260629100000_multi_game_extras.sql    # multiclass, gold, video/social
  20260629200000_mc_reactions_and_lists.sql  # schema pronto, JS ainda local
scripts/dev-game.js
tests/                                    # 21 ficheiros, 275 testes
```

## Docs

- `FEATURES.md` — Avatar features (pré-multi-game)
- `DIAGRAMAS-*` — Avatar diagrams (pré-multi-game)
- `DEV-LOCAL.md` — Local dev setup
- `docs/AVATAR-APP.md`, `DND-APP.md`, `MINECRAFT-APP.md` — por app
- `docs/MULTI-GAME-DESIGN.md` — landing, router, shared-auth, schema

## Doc Update Rules

Depois de implementar nova fase/feature set:
- Atualizar FEATURES.md (se afetar Avatar)
- Atualizar README.md (cabeçalho, dev scripts)
- Atualizar este ficheiro (conciso, modules table, status)
- Adicionar/atualizar doc dedicado em `docs/` para apps novas

## Working Style

- Ask clarifying questions before implementing when design decisions have multiple valid options
- Prefer multiple choice questions for faster decisions
- Don't assume — confirm scope, behavior, and edge cases when ambiguous

## Backlog (não tocar nesta branch)

- D&D: motor de combate (rolls automáticos, status effects)
- Minecraft: wirar reactions/lists em Supabase (schema pronto em
  `20260629200000_…`; UI precisa de passar de sync para async)
- Avatar: companheiros, Supabase Auth real
