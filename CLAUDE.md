# Avatar RPG — Claude Code Context

**Updated:** 2026-06-30

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
| D&D 5e | MVP + admin | Ficha · Perícias · Magias · Inventário · Trade · Hub · Importar · Admin |
| Minecraft | MVP + admin | Galeria · Painel Pessoal · Minhas Listas · Admin |
| Landing | Game selector + Admin Global | botão admin se sessão admin activa |

### Mudanças recentes

**2026-06-30 — Painéis Admin + cross-app role sync**
- Novo módulo partilhado `games/lib/users-registry.js` centraliza
  leitura/escrita do registry `avatar_rpg_users_registry`, validação de
  transições de role, contagem de admins e **sincronização das 4 chaves
  de sessão** (`avatar_rpg_user`, `dnd_user`, `mc_user`, `landing_user`)
  quando uma role muda. O Avatar `AdminPanel` delega aqui o
  role-change para que mudar role num jogo se propague aos restantes.
- Helper `confirmAndDeleteUser` (`games/lib/delete-user-ui.js`) +
  `users-registry.deleteUser` apagam uma conta em cascata: registry,
  ficha Avatar, ficha D&D, builds Minecraft, reactions, listas e
  sessões activas. Confirmação dupla. Regras: não apagar a si próprio,
  não apagar o último admin.
- Modal `lib/user-picker.js` para escolher um username (usado nas
  transferências MC single/bulk).
- **Landing** ganha botão "🛡️ Admin Global" (visível quando alguma das
  4 chaves de sessão tem role admin) → painel agregador em
  `landing/pages/AdminLandingPage.js` com utilizadores, estatísticas
  por jogo (#fichas Avatar, #fichas D&D, #builds MC), role mgmt e
  apagar conta.
- **D&D** tab Admin: lista utilizadores + ficha D&D (Nv/classes),
  role mgmt, "Editar" entra em **modo impersonate** (banner roxo
  "👁 A editar como ..."; tabs sheet/perícias/magias/inventário editam
  a ficha alvo; saves vão para esse username; botão "← Voltar a mim").
  `api/dnd-characters.deleteCharacter(username)` para Apagar ficha.
- **Minecraft** tab Admin: role mgmt + listagem de TODAS as builds com
  edit/delete e **Transferir** (single, escolha de destino via modal),
  mais **Transferir builds em bulk** por utilizador. `api/mc-builds`
  ganha `transferBuild` e `transferAllBuildsFromUser`.
- Roles partilhados continuam a viver em `avatar_rpg_users_registry`
  (chave herdada — manter o nome evita migrações de dados em browsers
  existentes).
- 25 ficheiros de teste · 332 testes vitest.

**2026-06-29 — Multi-game platform**
- Multi-game platform: landing + router + per-game session isolation
  (`avatar_rpg_user` / `dnd_user` / `mc_user` — sem fallback cross-app).
- Single-game mode via `?game=<id>` (`npm run dev:avatar|dnd|minecraft`).
- D&D 5e: full sheet, multiclass simples, trade com pre-validation,
  pack import 4 domínios (spells / subclasses / magic items / races).
- Minecraft: galeria pública 2 vistas (grelha quadrada com detalhe
  opcional, lista detalhada), tags, links sociais (YT/IG),
  likes/dislikes tipo YouTube, playlists "Minhas Listas".
- Filtros galeria: pesquisa, categoria (com "Outro" = sem categoria),
  tag, ordenação por data/likes/dislikes.
- Login overlay com brand+cor por jogo + botão "← Início" global.
- `dnd-character-mapper.js` para round-trip Supabase ↔ runtime sem
  perdas.

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
| admin | js/admin/ | AdminPanel (delega role-change a `lib/users-registry`), BackupRestore, LogService |
| storage | js/storage/ | AutoSave + export/import |
| combat | js/combat/ | Dice, resolver, status effects |
| api/characters,skills,items,auth | js/api/ | Existing Avatar APIs |

### Multi-game scaffolding
| File | Purpose |
|------|---------|
| js/router.js | Hash router (`#/<game>/<page>`), serializa unmount → mount |
| js/main.js | Registra jogos, single-game mode, botão "← Início" global |
| js/games/landing/ | Game selector (público) + Admin Global |
| js/games/landing/pages/AdminLandingPage.js | Painel admin global cross-app |
| js/games/back-widget.js | "← Início" flutuante (oculto em single-game) |
| js/games/lib/shared-auth.js | Factory de auth p/ D&D+MC (brand+title+session) |
| js/games/lib/users-registry.js | Registry partilhado, role rules, session sync, deleteUser cascata |
| js/games/lib/delete-user-ui.js | Helper UI: confirmação dupla + summary do que foi removido |
| js/games/lib/user-picker.js | Modal para escolher username (transfer builds) |

### D&D 5e
| File | Purpose |
|------|---------|
| games/dnd/index.js | Entry: tabs, autosave, GM rewards, admin impersonate-mode |
| games/dnd/data/srd.js | Tabelas SRD (skills, classes, races, XP) |
| games/dnd/dnd-character.js | Modelo + cálculos (mods, prof, saves, multiclass) |
| games/dnd/dnd-trade.js | State machine + pre-validation + applyTransfer |
| games/dnd/dnd-import.js | Validators + storage de 4 domínios |
| games/dnd/pages/ | Character, Skills, Spells, Inventory, Trade, Hub, Import, Admin |
| api/dnd-characters.js | CRUD + `deleteCharacter(username)` (Supabase + localStorage) |
| api/dnd-character-mapper.js | Flat row ↔ nested model (round-trip seguro) |

### Minecraft Builds
| File | Purpose |
|------|---------|
| games/minecraft/index.js | Entry: tabs Galeria/Painel/Listas/Admin |
| games/minecraft/lib/drive.js | Helpers Drive URL + probe assíncrono |
| games/minecraft/lib/social.js | Detect YT/IG/generic link |
| games/minecraft/components/reactions-bookmarks.js | Like/dislike + popover playlist |
| games/minecraft/pages/ | Gallery, MyPanel, BuildForm, Lists, Admin |
| api/mc-builds.js | CRUD builds + `transferBuild` + `transferAllBuildsFromUser` |
| api/mc-reactions.js | Like/dislike (localStorage; Supabase schema ready) |
| api/mc-lists.js | Playlists (localStorage; Supabase schema ready) |

## Key Patterns

- Role check: `authManager.hasRole('gm')` (player < gm < admin).
- Per-app storage namespaces (sem fallback cross-app):
  - `avatar_rpg_*` (auth, character, trades, logs, registry)
  - `dnd_*` (auth, character, trades, characters_registry, imported_*)
  - `mc_*` (auth, builds, reactions, lists_{username})
- Registry partilhado: `avatar_rpg_users_registry` (chave herdada do
  Avatar, agora consumida por todos os admin panels via
  `games/lib/users-registry.js`).
- Login overlay partilhado (`#login-overlay`) com brand contextual via
  CSS var `--login-accent` e logo dinâmico (`#login-logo`).
- Tests: `npm test` (vitest, 25 ficheiros, **332 testes**).

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
| admin | + Users, backup, logs, **apagar contas** | + Admin tab: gerir users, editar (impersonate) ou apagar ficha de qualquer jogador, **apagar contas** | + Admin tab: gerir users, editar/apagar qualquer build, **transferir builds (single/bulk)**, **apagar contas** |

> Painel adicional **Admin Global** na landing (botão visível se
> alguma sessão activa em qualquer app for admin) — agrega utilizadores
> e estatísticas dos 3 jogos + role mgmt cross-app + **apagar contas**.
>
> "Apagar conta" (cascata): remove registry + ficha Avatar + ficha
> D&D + builds Minecraft + reactions/listas + sessões activas. Pede
> confirmação DUPLA. Regras: não apagar a si próprio, não apagar o
> último admin.

## Dev scripts

```bash
npm run dev            # multi-game (landing + 3 apps)
npm run dev:avatar     # só Avatar
npm run dev:dnd        # só D&D
npm run dev:minecraft  # só Minecraft
npm test               # 332 testes (25 ficheiros)
```

## File Structure

```text
public/
├── index.html
├── css/ (main.css + components/*.css incl. dnd-sheet, mc-gallery, multi-game)
└── js/
    ├── api/                           ← Avatar + dnd-characters + mc-builds/reactions/lists
    ├── games/
    │   ├── landing/                   ← LandingPage + AdminLandingPage
    │   ├── lib/                       ← shared-auth, users-registry, delete-user-ui, user-picker
    │   ├── back-widget.js             ← "← Início"
    │   ├── avatar/index.js            ← delega no App existente
    │   ├── dnd/{index,data,pages}     ← inclui AdminPage com impersonate
    │   └── minecraft/{index,lib,pages,components}  ← inclui AdminPage
    ├── auth, character, skills, items, shop, hub, import, trade,
    │   admin (delega role-change), storage, combat, utils — Avatar
    ├── router.js                      ← serializa unmount→mount
    └── main.js                        ← single-game mode + botão Início

supabase/migrations/
  20260101000000_init.sql
  20260628000000_relax_rls_pre_auth.sql
  20260629000000_multi_game.sql           # dnd_characters, mc_builds
  20260629100000_multi_game_extras.sql    # multiclass, gold, video/social
  20260629200000_mc_reactions_and_lists.sql  # schema pronto, JS ainda local
scripts/dev-game.js
tests/                                    # 25 ficheiros, 332 testes
```

## Docs

Documentação humana vive em `docs/`:

- `docs/FEATURES.md` — Avatar features (pré-multi-game).
- `docs/DECISIONS.md` — Decisões aplicadas/pendentes.
- `docs/DEV-LOCAL.md` — Como correr localmente (com Supabase opcional).
- `docs/DIAGRAMAS-NÃO-TÉCNICOS.md`, `docs/DIAGRAMAS-TÉCNICOS.md` —
  Diagramas Avatar (pré-multi-game; ver `docs/MULTI-GAME-DESIGN.md`
  para a arquitetura actual).
- `docs/AVATAR-APP.md`, `docs/DND-APP.md`, `docs/MINECRAFT-APP.md` — por app.
- `docs/MULTI-GAME-DESIGN.md` — landing, router, shared-auth, schema,
  admin panels.

`README.md` (raiz) é o índice de alto nível.

## Doc Update Rules

Depois de implementar nova fase/feature set:
- Atualizar `docs/FEATURES.md` (se afetar Avatar).
- Atualizar `README.md` (cabeçalho, dev scripts).
- Atualizar este ficheiro (conciso, modules table, status).
- Adicionar/atualizar doc dedicado em `docs/` para apps novas ou
  features cross-app.
- Sincronizar `.github/copilot-instructions.md` (mesma estrutura).

## Working Style

- Ask clarifying questions before implementing when design decisions have multiple valid options.
- Prefer multiple choice questions for faster decisions.
- Don't assume — confirm scope, behavior, and edge cases when ambiguous.

## Backlog (não tocar nesta branch)

- D&D: motor de combate (rolls automáticos, status effects).
- Minecraft: wirar reactions/lists em Supabase (schema pronto em
  `20260629200000_…`; UI precisa de passar de sync para async).
- Avatar: companheiros, Supabase Auth real.
