# Avatar RPG — Multi-game Platform

> **Documentação Completa:**
> - [FEATURES.md](./FEATURES.md) — Todas as páginas e mecânicas (atuais e futuras)
> - [DECISIONS.md](./DECISIONS.md) — Decisões aplicadas e pendentes
> - [DIAGRAMAS-NÃO-TÉCNICOS.md](./DIAGRAMAS-NÃO-TÉCNICOS.md) — Fluxos e mecânicas do jogo
> - [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md) — Arquitetura, schema DB, APIs, schemas JSON
> - [DEV-LOCAL.md](./DEV-LOCAL.md) — Como correr localmente (com Supabase opcional)
>
> **Por app (`docs/`):**
> - [AVATAR-APP.md](./docs/AVATAR-APP.md) · [DND-APP.md](./docs/DND-APP.md) · [MINECRAFT-APP.md](./docs/MINECRAFT-APP.md)
> - [MULTI-GAME-DESIGN.md](./docs/MULTI-GAME-DESIGN.md) — landing + router + single-game mode

## Visão Geral

Plataforma web que aloja **três aplicações independentes** que partilham
infraestrutura (landing, login overlay, persistência localStorage /
Supabase opcional):

| App         | O quê                                                                 | Status |
|-------------|----------------------------------------------------------------------|--------|
| **Avatar**  | RPG inspirado em *Avatar: The Last Airbender* (fichas, dobras, hub)  | ✅ Phases 1-6 |
| **D&D 5e**  | Fichas D&D 5e completas (multiclass, magias, trade, import de packs) | ✅ MVP |
| **Minecraft** | Galeria de builds com likes/dislikes e playlists pessoais          | ✅ MVP |

Cada app tem o seu próprio look (cor, logo) no overlay de login que herda
das cores da landing card. Sessões são isoladas por app (`avatar_rpg_user`,
`dnd_user`, `mc_user`).

**Público:** tu e os teus amigos. Login local (sem password), single-server.

---

## Arquitetura Multi-Site

Este projeto **já é** o portal multi-aplicação:

```
┌─────────────────────────────────────────────────────────────┐
│              LANDING (#/) — seletor de jogo                 │
│       cartões Avatar · D&D · Minecraft (público, sem login) │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Avatar RPG    │  │   Site 2        │  │   Site 3        │
│   (atual)       │  │   (futuro)      │  │   (futuro)      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Arquitetura Técnica (Avatar RPG)

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

---

## Sistema de Jogo

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
- **Esquiva:** 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura

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
| **Futuro** | Companheiros com stats, integração Supabase | ⚪ Backlog |

### Implementado

**Fase 1 — Base jogável**
- ✅ Autenticação simples por username
- ✅ Ficha de personagem com atributos editáveis, stats derivados e progressão por XP
- ✅ Árvores de habilidades visuais por elemento/categoria/tier
- ✅ Loja mock para navegação inicial da experiência
- ✅ Hub mock de jogadores
- ✅ Auto-save com persistência local
- ✅ Import/Export JSON do personagem

**Fase 2 — Economia e importação**
- ✅ Sistema de ouro integrado à progressão e compras
- ✅ Loja funcional com compra de itens
- ✅ Badges de raridade nos itens
- ✅ Ferramentas de GM para dar ouro e XP
- ✅ Importação JSON de skills e items com validação e preview
- ✅ Dados importados substituem os mocks quando disponíveis

**Fase 3 — Funcionalidades de grupo**
- ✅ Hub com dados reais persistidos em localStorage
- ✅ Modal de visualização de personagem para GM (read-only)
- ✅ Recompensas de grupo em ouro e XP
- ✅ Entrega de loot a jogadores
- ✅ Sistema de trocas entre jogadores com notificações

**Fase 4 — Administração**
- ✅ Painel de admin para gestão de utilizadores
- ✅ Promoção e despromoção de roles
- ✅ Backup/restore completo do estado via export/import de localStorage
- ✅ Sistema de logs com serviço dedicado e viewer com filtros/paginação

**Fase 5 — Testes e Melhorias**
- ✅ Correção de memory leaks (reutilização de instâncias GroupRewards/LootDelivery)
- ✅ Debounce de 50ms no refresh do Hub para evitar renders duplicados
- ✅ Cleanup de event listeners (método `destroy()` no HubPage)
- ✅ Consolidação de exports no módulo trade
- ✅ Cleanup automático ao re-inicializar Hub (cenário login/logout/re-login)

**Fase 6 — Features Avançadas**
- ✅ Moedas por nação (secundárias por elemento, ouro continua universal)
- ✅ Subclasses desbloqueáveis (3 por elemento, requisitos + bónus permanente)
- ✅ Limites de habilidades visuais (barra de slots, lock quando cheio)
- ✅ Pergaminhos consumíveis (expandir slots ou marcar skill como dominada)
- ✅ Sub-skill slots UI (checkboxes com custo e validação)
- ✅ Página dedicada de inventário (equip/unequip, filtros, detalhes)
- ✅ Raridade mecânica (multiplicador + bónus flat nos stats)
- ✅ Transferências forçadas GM (ouro/moedas/itens entre jogadores)

---

## Estrutura do Projeto

```
avatar-rpg/
├── public/                    ← Frontend
│   ├── index.html             ← Página principal (SPA)
│   ├── css/
│   │   ├── main.css           ← Variables + base styles
│   │   └── components/        ← CSS por componente
│   │       ├── admin.css              ← Painel admin
│   │       ├── character-modal.css    ← Modal read-only do GM
│   │       ├── import.css             ← Fluxo de importação JSON
│   │       ├── trade.css              ← UI de trocas e notificações
│   │       └── ...                    ← Restantes estilos da app
│   └── js/
│       ├── main.js            ← Entry point (bootstrap)
│       ├── app.js             ← App class (orchestrator)
│       ├── admin/             ← Admin panel, LogService, LogViewer, BackupRestore
│       ├── api/               ← API client + endpoints
│       ├── auth/              ← AuthManager
│       ├── character/         ← Character, stats, XP, slots
│       ├── combat/            ← Dice, resolver, status effects
│       ├── hub/               ← Hub page + dados reais/mocks
│       ├── import/            ← JSON import (validators, storage, ImportPage)
│       ├── items/             ← Item list + inventory
│       ├── shop/              ← Shop page + compra de itens
│       ├── skills/            ← Skill tree + cards + data loader
│       ├── storage/           ← AutoSave, backup, import, export
│       ├── trade/             ← Trade system (TradeManager, TradeModal, notifications)
│       └── utils/             ← Constants, DOM helpers, validators
├── netlify/
│   └── functions/             ← API serverless (Netlify Functions)
│       ├── auth-*.js          ← Login/logout/me
│       ├── characters*.js     ← CRUD personagens
│       ├── skills*.js         ← Skills por elemento
│       ├── items*.js          ← Items e shop
│       ├── gm-*.js            ← Ferramentas GM
│       ├── admin-*.js         ← Ferramentas Admin
│       └── lib/               ← Helpers (supabase, cors, auth, response)
├── supabase/
│   ├── schema.sql             ← Estrutura da BD
│   └── seed.sql               ← (vazio — dados via JSON import)
├── Initial Files/             ← Ficheiros de referência do protótipo
├── netlify.toml               ← Config Netlify (routes, functions)
├── package.json               ← Dependencies (serve, supabase-js, vitest)
├── vitest.config.js           ← Test configuration
├── tests/                     ← Unit tests (101 tests, game logic only)
├── .env.example               ← Template variáveis ambiente
└── DEV-LOCAL.md               ← Como correr localmente
```

### Comandos

```bash
npm run dev          # Tudo: landing + Avatar + D&D + Minecraft (porta 3000)
npm run dev:avatar   # Apenas a app Avatar RPG (esconde a landing)
npm run dev:dnd      # Apenas a app D&D 5e
npm run dev:minecraft# Apenas a app Minecraft Builds
npm test             # Correr testes unitários
npm run test:watch   # Testes em modo watch
```

Os scripts `dev:<game>` arrancam o mesmo servidor mas abrem o browser
diretamente nessa app (`?game=<id>`), saltando o seletor de jogos —
útil para desenvolvimento focado.

Cada app tem documentação dedicada em `docs/`:
- [`docs/AVATAR-APP.md`](./docs/AVATAR-APP.md)
- [`docs/DND-APP.md`](./docs/DND-APP.md)
- [`docs/MINECRAFT-APP.md`](./docs/MINECRAFT-APP.md)
- [`docs/MULTI-GAME-DESIGN.md`](./docs/MULTI-GAME-DESIGN.md) — arquitetura
  do multi-game e modo single-app.

---

## Schema de Importação

**Documentação completa:** [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md#9-schema-para-importação)

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

- **Flexibilidade > Perfeição:** Priorize funcional sobre bem arquitetado
- **APIs em bypass:** Para dev local sem Supabase, as APIs retornam mocks (ver `public/js/api/`)
- **Estado atual:** Fases 1-6 completas. Próximos passos: Companheiros e integração Supabase.

---

## Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
