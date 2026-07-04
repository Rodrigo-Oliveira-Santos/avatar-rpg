# Avatar RPG — Multi-game Platform

> **Documentação Completa (em `docs/`):**
> - [docs/FEATURES.md](./docs/FEATURES.md) — Páginas e mecânicas Avatar (atuais e futuras)
> - [docs/DECISIONS.md](./docs/DECISIONS.md) — Decisões aplicadas e pendentes
> - [docs/DIAGRAMAS-NAO-TECNICOS.md](./docs/DIAGRAMAS-NAO-TECNICOS.md) — Fluxos e mecânicas do jogo
> - [docs/DIAGRAMAS-TECNICOS.md](./docs/DIAGRAMAS-TECNICOS.md) — Arquitetura, schema DB, APIs, schemas JSON
> - [docs/DEV-LOCAL.md](./docs/DEV-LOCAL.md) — Como correr localmente (com Supabase opcional)
>
> **Por app:**
> - [docs/AVATAR-APP.md](./docs/AVATAR-APP.md) · [docs/DND-APP.md](./docs/DND-APP.md) · [docs/MINECRAFT-APP.md](./docs/MINECRAFT-APP.md)
> - [docs/MULTI-GAME-DESIGN.md](./docs/MULTI-GAME-DESIGN.md) — landing, router, single-game mode, admin panels

## Visão Geral

Plataforma web que aloja **três aplicações independentes** que partilham
infraestrutura (landing, login overlay, persistência localStorage /
Supabase opcional):

| App           | O quê                                                                | Status              |
|---------------|----------------------------------------------------------------------|---------------------|
| **Avatar**    | RPG inspirado em *Avatar: The Last Airbender* (fichas, dobras, hub, GM Control, monstros, combat, trades cross-browser) | ✅ Fases 1-6 + GM tooling + Admin |
| **D&D 5e**    | Fichas D&D 5e completas (multiclass, magias, trade, import de packs) | ✅ MVP + Admin       |
| **Minecraft** | Galeria de builds com likes/dislikes e playlists pessoais            | ✅ MVP + Admin       |

Cada app tem o seu próprio look (cor, logo) no overlay de login que herda
das cores da landing card. Sessões são isoladas por app (`avatar_rpg_user`,
`dnd_user`, `mc_user`) e o role registry é partilhado
(`avatar_rpg_users_registry`) para permitir gestão cross-app.

A landing tem um botão "🛡️ Admin Global" que abre um painel agregador
quando alguma sessão activa em qualquer app for admin (utilizadores +
estatísticas dos 3 jogos + role mgmt + apagar contas).

**Público:** tu e os teus amigos. Login local (sem password), single-server.

---

## Arquitetura Multi-App

```
┌─────────────────────────────────────────────────────────────┐
│              LANDING (#/) — seletor de jogo                 │
│       cartões Avatar · D&D · Minecraft                      │
│       + 🛡️ Admin Global (visível se sessão admin activa)    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Avatar RPG    │  │     D&D 5e      │  │   Minecraft     │
│  (#/avatar)     │  │   (#/dnd)       │  │  (#/minecraft)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Cada app é montada/desmontada pelo router em
`public/js/router.js` (serializa unmount→mount, sem dois roots
simultâneos). O botão "← Início" fica sempre visível dentro de uma app
(excepto em single-game mode).

---

## Arquitetura Técnica

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Netlify         │────▶│   Supabase      │
│   (HTML + CSS + │     │  Functions       │     │   (PostgreSQL   │
│   JavaScript)   │◀────│  (serverless)    │◀────│   + Auth)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
  Netlify (free)          Incluído no Netlify     Supabase (free tier)
```

### Stack Tecnológico

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Frontend | HTML + CSS + JS (ES6+) | Modular, sem frameworks |
| Backend | Netlify Functions | Serverless, escala a zero (free) |
| Database | Supabase | Auth incluso, real-time, 500MB free |
| Deploy | Netlify | Deploy automático do Git |

> O modo default é **localStorage**. Para activar Supabase ver
> [docs/DEV-LOCAL.md](./docs/DEV-LOCAL.md).

---

## Sistema de Jogo (Avatar)

### Atributos

| Atributo | Descrição |
|----------|-----------|
| **FOR** (Força) | Dano físico, requisitos de armas |
| **AGI** (Agilidade) | Esquiva, velocidade |
| **CHI** (Chi) | Energia para habilidades |
| **PER** (Percepção) | Precisão, detecção |
| **RES** (Resistência) | Defesa física |
| **ESP** (Espírito) | Vida espiritual, cura |

**Stats Derivados:**
- **Vida:** 10 + (nível × 8) + (FOR × 3)
- **Chi máx:** 6 + (nível × 5) + (CHI × 4)
- **Espírito máx:** 8 + (nível × 6) + (ESP × 3)
- **Defesa:** (RES × 2) + nível + bónus_armadura
- **Esquiva:** 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura (cap 15)

### Progressão

- **Nível máximo:** 40
- **Pontos por nível:** 3 (distribuídos livremente)
- **XP para próximo nível:** `round(200 × (nível-1)^1.55)`
- **Level-up automático:** XP acumula e sobe de nível quando suficiente
- **Marcos:** Aprendiz (5), Discípulo (10), Praticante (15), Veterano (20), Especialista (25), Mestre (30), Grande Mestre (35), Lendário (40)

### Habilidades

- Organizadas por **elemento** → **categoria** → **tier**
- **Categorias:** Espiritualidade, Agilidade, Combate Preciso, Combate Bruto
- **Tiers:** Iniciante (1), Avançado (2), Mestre (3), Lendário (4)
- **Requisitos:** Atributos mínimos + habilidades prévias desbloqueadas

### Elementos

| Elemento | Status |
|----------|--------|
| Fogo | ✅ Mock disponível |
| Água | ✅ Mock disponível |
| Terra | ✅ Mock disponível |
| Ar | ✅ Mock disponível |
| Sem Dobra | ✅ Mock disponível |

> Para D&D 5e e Minecraft, ver respectivamente
> [docs/DND-APP.md](./docs/DND-APP.md) e
> [docs/MINECRAFT-APP.md](./docs/MINECRAFT-APP.md).

---

## Estado Atual e Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 1** | MVP (Auth, ficha, skill trees, loja mock, hub mock) | ✅ Completo |
| **Fase 2** | Economia e JSON (ouro, loja funcional, importação validada) | ✅ Completo |
| **Fase 3** | Grupo (hub funcional, recompensas, loot, trocas) | ✅ Completo |
| **Fase 4** | Admin (gestão de utilizadores, backup/restore, logs) | ✅ Completo |
| **Fase 5** | Testes e Melhorias (memory leaks, debounce, cleanup) | ✅ Completo |
| **Fase 6** | Features Avançadas (moedas, subclasses, inventário, raridade, gifts) | ✅ Completo |
| **Multi-game** | Landing + D&D + Minecraft + admin panels cross-app | ✅ Completo |
| **Futuro** | Companheiros com stats, integração Supabase completa | ⚪ Backlog |

> Ver [docs/FEATURES.md](./docs/FEATURES.md) para o detalhe de cada
> fase do Avatar.

---

## Estrutura do Projeto

```
avatar-rpg/
├── public/                    ← Frontend
│   ├── index.html             ← SPA (todos os jogos vivem aqui)
│   ├── config.example.js      ← Template Supabase (config.js é gitignored)
│   ├── serve.json             ← Headers COI (COOP/COEP) para o `serve` dev
│   ├── data/skills/           ← JSONs canónicos das skill trees (Avatar, por elemento)
│   ├── css/
│   │   ├── main.css
│   │   └── components/        ← incl. multi-game.css, dnd-sheet.css, mc-gallery.css,
│   │                             admin.css, gm-control.css, monsters.css, …
│   └── js/
│       ├── main.js            ← Entry: regista jogos + single-game mode
│       ├── router.js          ← Hash router (#/<game>/<page>)
│       ├── app.js             ← Avatar App class (orchestrator)
│       ├── games/
│       │   ├── landing/       ← LandingPage + AdminLandingPage (cross-app)
│       │   ├── lib/           ← shared-auth, users-registry, delete-user-ui, user-picker
│       │   ├── back-widget.js ← "← Início" flutuante
│       │   ├── avatar/        ← delega no App existente
│       │   ├── dnd/           ← Full 5e: index, data/srd, pages/, dnd-character.js, …
│       │   └── minecraft/     ← Galeria + Painel + Listas + Admin
│       ├── admin/             ← Avatar AdminPanel (delega role-change a lib/users-registry)
│       ├── auth, character, skills, items, shop, hub, import, trade,
│       │   storage, monsters, gm-control, combat   ← Avatar
│       ├── utils/             ← dom, toast (× + Limpar tudo), validators, constants, statusEffects
│       └── api/               ← Avatar (incl. gm-characters, monsters, encounters,
│                                shopProfiles, trades) + dnd-characters/+mapper +
│                                mc-builds/reactions/lists
├── data/skills/               ← Source-of-truth das skill trees Avatar (espelhado em public/)
├── scripts/
│   ├── dev-game.js            ← launcher single-game (?game=<id>)
│   └── extract-skill-trees.mjs  ← gerador HTML → JSON
├── netlify/functions/         ← API serverless (Avatar; legacy em bypass mode)
├── supabase/
│   ├── migrations/            ← init + relax-RLS + multi-game + skills-v2 + monsters +
│   │                            encounters + status-effects + vitals-realtime +
│   │                            shop_profiles + trades + …
│   ├── seed.sql               ← Test data determinístico (utilizadores + chars + items + monstros)
│   └── schema.sql             ← Snapshot legado (referência)
├── docs/                      ← Documentação humana
│   ├── AVATAR-APP.md, DND-APP.md, MINECRAFT-APP.md, MULTI-GAME-DESIGN.md
│   ├── FEATURES.md, DECISIONS.md, DEV-LOCAL.md
│   ├── DIAGRAMAS-NAO-TECNICOS.md, DIAGRAMAS-TECNICOS.md
│   └── skill-trees/           ← HTMLs originais das trees
├── tests/                     ← Vitest
├── netlify.toml               ← Config Netlify + headers COI em produção
├── package.json
├── vitest.config.js
├── .env.example
├── CLAUDE.md                  ← Contexto p/ Claude Code
├── .github/copilot-instructions.md  ← Contexto p/ GitHub Copilot
└── README.md
```

### Comandos

```bash
npm run dev            # Tudo: landing + Avatar + D&D + Minecraft (porta 3000, headers COI)
npm run dev:avatar     # Apenas a app Avatar RPG (esconde a landing)
npm run dev:dnd        # Apenas a app D&D 5e
npm run dev:minecraft  # Apenas a app Minecraft Builds
npm run dev:all        # Supabase local + db:reset (seed) + dev (tudo numa linha)
npm test               # Testes unitários (vitest)
npm run test:watch     # Testes em modo watch
```

Os scripts `dev:<game>` arrancam o mesmo servidor mas abrem o browser
diretamente nessa app (`?game=<id>`), saltando o seletor de jogos —
útil para desenvolvimento focado.

Cada app tem documentação dedicada em `docs/`:
- [`docs/AVATAR-APP.md`](./docs/AVATAR-APP.md)
- [`docs/DND-APP.md`](./docs/DND-APP.md)
- [`docs/MINECRAFT-APP.md`](./docs/MINECRAFT-APP.md)
- [`docs/MULTI-GAME-DESIGN.md`](./docs/MULTI-GAME-DESIGN.md) — arquitetura
  do multi-game, modo single-app e admin panels cross-app.

---

## Schema de Importação

**Documentação completa:** [docs/DIAGRAMAS-TECNICOS.md](./docs/DIAGRAMAS-TECNICOS.md#9-schema-para-importação)

### Schema de Habilidade (Resumo)

```json
{
  "element": "fogo|agua|terra|ar|non_bending",
  "category": "spirit|agility|precise_combat|brute_combat",
  "tier": 1|2|3|4,
  "name": "Nome da Habilidade",
  "description": "Descrição curta",
  "requirements": { "FOR": 0, "AGI": 0, "CHI": 0, "PER": 0, "RES": 0, "ESP": 0 },
  "prerequisites": ["Nome Habilidade Prévia"],
  "position": "off|def|any|pass",
  "attacks": [...],
  "passive_effect": {...}
}
```

---

## Notas de Desenvolvimento

- **Flexibilidade > Perfeição:** Priorizar funcional sobre bem arquitetado.
- **APIs em fallback:** Em modo local sem Supabase, as APIs (`api/*.js`)
  caem em localStorage. Activar Supabase via
  `public/config.js` (`useSupabase: true`) ou `?supabase=1` na URL.
- **Estado atual:** Multi-game completo (Avatar fases 1-6, D&D 5e MVP,
  Minecraft MVP) com painéis admin per-app e Admin Global na landing.
  Próximos passos: Companheiros (Avatar), motor de combate (D&D),
  Supabase para reactions/listas (MC).

---

## Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
