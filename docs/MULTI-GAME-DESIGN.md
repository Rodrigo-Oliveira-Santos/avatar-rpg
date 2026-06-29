# Multi-Game Platform — Design

**Status:** Avatar (Phases 1-6) ✓ · D&D 5e (MVP) ✓ · Minecraft (MVP) ✓
**Branch:** `feature/multi-game-platform`
**Updated:** 2026-06-29

> Cada app tem um doc próprio:
> [`AVATAR-APP.md`](AVATAR-APP.md) · [`DND-APP.md`](DND-APP.md) · [`MINECRAFT-APP.md`](MINECRAFT-APP.md)

## Goal

Extend the site to host three independent "apps" sharing the same user/auth layer:

| App        | Purpose                                                                    | Status              |
|------------|----------------------------------------------------------------------------|---------------------|
| `avatar`   | The existing Avatar: The Last Airbender RPG                                | Done (Phases 1-6)   |
| `dnd`      | Plain D&D 5e character sheets — no Avatar customisations                   | MVP (full sheet)    |
| `minecraft`| Showcase of Minecraft build schematics, hosted via external file links     | MVP (gallery + CRUD)|

## Top-level navigation

The site opens on a **landing page** (game selector). Picking a card
navigates to that game; the router unmounts the previous module (full
teardown) before mounting the next one. Switching games is therefore
equivalent to switching apps — each game owns its own session.

```
#/                    → Landing (game selector, public, no auth)
#/avatar              → Avatar RPG SPA (own login overlay)
#/avatar/hub          → Avatar Hub
#/dnd                 → D&D index
#/minecraft           → Minecraft builds gallery
```

Inside any game, a fixed `← Hub` button (top-left) navigates back to the
landing — which triggers `unmount()` of that game.

The router is a small hash dispatcher (`public/js/router.js`); no framework.

## Single-game mode (development)

Para testar uma app em isolado, sem o seletor de jogos, há scripts npm
dedicados:

```bash
npm run dev          # multi-game (landing + 3 apps)
npm run dev:avatar   # só Avatar
npm run dev:dnd      # só D&D
npm run dev:minecraft # só Minecraft
```

Os scripts isolados abrem `http://localhost:3000/?game=<id>#/<id>`. O
parâmetro `?game=` é lido por `public/js/main.js`:

1. Só o jogo indicado é registado no router (landing fica skipped).
2. O hash é forçado para `#/<id>` se chegar vazio.
3. A flag `window.__SINGLE_GAME_MODE__` é exposta — o widget
   "← Início" deteta-a e não se renderiza (não há para onde voltar).

Em produção (sem `?game=`) o comportamento original mantém-se: landing
público + cartões dos 3 jogos.

## Session isolation

- The **landing page is public** — no auth required.
- Each game decides whether it requires login.
- When a game's `unmount()` runs, it does a **full teardown**:
  - Flushes any pending autosave to localStorage (and Supabase if enabled);
  - Destroys per-user pages, listeners and timers;
  - Clears the game's auth keys (silent logout) so re-entering shows the
    login overlay again.
- Auth keys are **namespaced per game**:
  - Avatar usa `avatar_rpg_user` (gerido pelo `AuthManager` original).
  - D&D usa `dnd_user` e Minecraft `mc_user`, ambos geridos pelo
    factory partilhado `public/js/games/lib/shared-auth.js` —
    centraliza o reuso do `#login-overlay` (título por jogo, hints
    contextuais, clone de form para evitar leak de listeners).

## Next steps (backlog)

## Folder layout

```
public/js/
├── api/                 ← shared API layer (Supabase + localStorage fallback)
├── auth/                ← Avatar AuthManager (não tocado por D&D / MC)
├── router.js            ← hash router
├── games/
│   ├── lib/             ← código partilhado entre os jogos novos
│   │   └── shared-auth.js   ← createSharedAuth({ storageKey, defaultTitle })
│   ├── avatar/          ← Avatar entrypoint (delegates to existing modules)
│   ├── dnd/
│   │   ├── index.js     ← D&D entrypoint (mount/unmount, tabs, autosave)
│   │   ├── data/srd.js  ← tabelas SRD (skills, classes, races, XP)
│   │   ├── dnd-character.js  ← modelo + cálculos (modifiers, prof, saves)
│   │   ├── dnd-trade.js      ← trade entre jogadores (state machine)
│   │   ├── dnd-import.js     ← packs (spells/subclasses/items/races)
│   │   └── pages/            ← Character, Skills, Spells, Inventory, Trade,
│   │                            Hub, Import
│   └── minecraft/
│       ├── index.js     ← Minecraft entrypoint
│       ├── lib/         ← drive.js (link helpers), social.js (YT/IG)
│       └── pages/       ← Gallery, MyPanel, BuildForm
└── utils/, character/, … (existing shared)
```

## Schema (Supabase)

Migration `20260629000000_multi_game.sql` introduz `dnd_characters`,
`mc_builds` e `mc_build_likes`. A `20260629100000_multi_game_extras.sql`
adiciona depois:
- `dnd_characters.classes jsonb` (multiclass)
- `mc_builds.video_url`, `mc_builds.social_url` (links opcionais)

### D&D 5e

```sql
create table dnd_characters (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  race        text,
  class       text,                          -- classe principal (sync c/ classes[0])
  classes     jsonb default '[]',            -- multiclass: [{class, subclass, level}]
  background  text,
  alignment   text,
  level       int not null default 1 check (level between 1 and 20),
  xp          int not null default 0,
  hp_max      int not null default 1,
  hp_current  int not null default 1,
  ac          int not null default 10,
  speed       int not null default 30,
  -- Ability scores (rolled or point-buy)
  abilities   jsonb default '{}',   -- { STR, DEX, CON, INT, WIS, CHA }
  saves       jsonb default '{}',   -- proficiency flags per ability
  skills      jsonb default '{}',   -- proficiency / expertise per skill
  inventory   jsonb default '[]',
  spells      jsonb default '{}',   -- prepared / known
  features    jsonb default '[]',   -- class/racial features
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

Same JSON-heavy strategy as `characters` table — keeps the relational schema
slim while iterating on the UI.

### Minecraft Builds

```sql
create table mc_builds (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references users(id) on delete cascade,
  title           text not null,
  description     text,
  thumbnail_url   text,             -- external URL (Drive / Imgur / Supabase Storage)
  download_url    text,             -- Drive link to .schematic / .nbt / .litematic
  category        text check (category in ('survival','redstone','farm','aesthetic','adventure','other')),
  tags            text[] default '{}',
  mc_version      text,
  dimensions      jsonb,            -- { x, y, z }
  is_public       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table mc_build_likes (
  build_id  uuid not null references mc_builds(id) on delete cascade,
  user_id   uuid not null references users(id) on delete cascade,
  liked_at  timestamptz not null default now(),
  primary key (build_id, user_id)
);
```

Files themselves stay on Google Drive — the DB only stores metadata.
A typical row is ~200B-2KB, so even thousands of builds use a few MB.

## API pattern

Same as the Avatar layer:

```
public/js/api/dnd-characters.js   ← Supabase queries + localStorage fallback
public/js/api/mc-builds.js        ← same pattern
```

When `useSupabase: true` they hit Supabase via `supabase-client.js`; when
disabled, they read/write per-user localStorage like the Avatar APIs already do.

## RLS strategy

Once Supabase Auth lands:

| Table                | Read                        | Write                  |
|----------------------|-----------------------------|------------------------|
| `dnd_characters`     | owner + admins              | owner                  |
| `mc_builds` (public) | anyone (`is_public=true`)   | owner                  |
| `mc_builds` (private)| owner + admins              | owner                  |
| `mc_build_likes`     | anyone                      | self only              |

Until Auth is in place, these tables ride on the same permissive policies
introduced by `20260628000000_relax_rls_pre_auth.sql`.

## Migration order

1. Avatar PR (`Project-Scructure`) merges into `master`.
2. This branch rebases onto `master`.
3. Future incremental work: D&D character sheet UI, then Minecraft gallery.

## Next steps (backlog)

- Substituir localStorage por Supabase Auth real (cookies + RLS).
- **D&D**: motor de combate (rolls automáticos, status effects, dice
  resolver) — único item D&D ainda em backlog.
- (Avatar) Companheiros com stats próprios e Supabase Auth real.
