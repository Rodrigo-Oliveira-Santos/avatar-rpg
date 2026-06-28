# Multi-Game Platform — Design

**Status:** scaffolding only (no features yet)
**Branch:** `feature/multi-game-platform`
**Updated:** 2026-06-28

## Goal

Extend the site to host three independent "apps" sharing the same user/auth layer:

| App        | Purpose                                                                    | Status              |
|------------|----------------------------------------------------------------------------|---------------------|
| `avatar`   | The existing Avatar: The Last Airbender RPG                                | Done (Phases 1-6)   |
| `dnd`      | Plain D&D 5e character sheets — no Avatar customisations                   | Placeholder         |
| `minecraft`| Showcase of Minecraft build schematics, hosted via external file links     | Placeholder         |

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

## Session isolation

- The **landing page is public** — no auth required.
- Each game decides whether it requires login.
- When a game's `unmount()` runs, it does a **full teardown**:
  - Flushes any pending autosave to localStorage (and Supabase if enabled);
  - Destroys per-user pages, listeners and timers;
  - Clears the game's auth keys (silent logout) so re-entering shows the
    login overlay again.
- Auth keys are **namespaced per game** (`avatar_rpg_user`, future
  `dnd_user`, etc.) — leaving one game cannot leak credentials to another.

## Folder layout

```
public/js/
├── api/                 ← shared API layer (Supabase + localStorage fallback)
├── auth/                ← shared AuthManager
├── router.js            ← hash router
├── games/
│   ├── avatar/          ← Avatar entrypoint (delegates to existing modules)
│   ├── dnd/
│   │   ├── index.js     ← D&D entrypoint
│   │   ├── pages/       ← CharactersPage, SheetPage, ...
│   │   └── data.js      ← (future) DnDCharacter model + API wrappers
│   └── minecraft/
│       ├── index.js     ← Minecraft entrypoint
│       ├── pages/       ← BuildsPage, BuildDetailPage
│       └── data.js
└── utils/, character/, … (existing shared)
```

## Schema (Supabase)

Migration `20260629000000_multi_game.sql` introduces two new domains.

### D&D 5e

```sql
create table dnd_characters (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  race        text,
  class       text,
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

## Next steps (not in this commit)

- Implement D&D character sheet (5e rules: STR mods, prof bonus, saves, skills).
- Implement Minecraft builds gallery + create-build form (URL inputs only).
- Add `dnd-characters.js`, `mc-builds.js` API modules.
- Wire likes endpoint for Minecraft builds.
- Migrate AuthManager so the same login serves the three games.
