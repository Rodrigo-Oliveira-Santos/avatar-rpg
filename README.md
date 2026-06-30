# Avatar RPG — Sistema de Personagem Web

> **Documentação Completa:**
> - [docs/FEATURES.md](./docs/FEATURES.md) — Todas as páginas e mecânicas (atuais e futuras)
> - [docs/DECISIONS.md](./docs/DECISIONS.md) — Decisões aplicadas e pendentes
> - [docs/DIAGRAMAS-NAO-TECNICOS.md](./docs/DIAGRAMAS-NAO-TECNICOS.md) — Fluxos e mecânicas do jogo
> - [docs/DIAGRAMAS-TECNICOS.md](./docs/DIAGRAMAS-TECNICOS.md) — Arquitetura, schema DB, APIs, schemas JSON
> - [docs/DEV-LOCAL.md](./docs/DEV-LOCAL.md) — Como correr localmente (com Supabase opcional)

## Visão Geral

Sistema de RPG customizado inspirado em **Avatar: The Last Air Bender**, estilo D&D, com foco em:
- Distribuição de atributos (FOR, AGI, CHI, PER, RES, ESP)
- Progressão por níveis (máx 40)
- Desbloqueio de habilidades por elemento (Fogo, Água, Terra, Ar, Sem Dobra)
- Sistema de combate com dados, status effects e custos de Chi

**Público:** Você e seus amigos. Multi-usuário com autenticação simples (nome do personagem).

---

## Arquitetura Multi-Site (Visão Futura)

Este projeto é o **primeiro módulo** de um portal web mais amplo. A estrutura deve acomodar:

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTAL HUB (futuro)                      │
│  Uma página inicial que lista e linka para todos os sites   │
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
│   ├── config.example.js      ← Template de config (Supabase)
│   ├── serve.json             ← Headers COI (COOP/COEP) para o `serve` dev
│   ├── css/
│   │   ├── main.css           ← Variables + base styles
│   │   └── components/        ← CSS por componente
│   └── js/
│       ├── main.js            ← Entry point (bootstrap)
│       ├── app.js             ← App class (orchestrator)
│       ├── admin/             ← AdminPanel, LogService, LogViewer, BackupRestore
│       ├── api/               ← API client + endpoints (incl. gm-characters helper)
│       ├── auth/              ← AuthManager
│       ├── character/         ← Character, stats, XP, slots, NotesEditor
│       ├── combat/            ← Dice, EncounterPanel, BattleLauncher, statusTicks
│       ├── gm-control/        ← GMControlPage + delegated modals (Shop/Inventory/Skills)
│       ├── hub/               ← HubPage (mapa interativo + grelha + ferramentas)
│       ├── import/            ← JSON import (validators, storage, ImportPage)
│       ├── items/             ← InventoryPage + equip/unequip + scrolls
│       ├── monsters/          ← MonstersPage (staged/library/cemetery)
│       ├── shop/              ← Shop page (player view + GM CRUD)
│       ├── skills/            ← Skill tree + cards + data loader + PathPicker
│       ├── storage/           ← AutoSave
│       ├── trade/             ← TradeManager, TradeModal, TradeHistoryPanel
│       └── utils/             ← Constants, DOM helpers, toast, statusEffects
├── data/skills/               ← JSONs canónicos das skill trees (por elemento)
├── scripts/                   ← Utilitários (extract-skill-trees.mjs, …)
├── netlify/
│   └── functions/             ← API serverless (legacy, não-ativo em bypass mode)
├── supabase/
│   ├── migrations/            ← Schema canónico (npx supabase db reset)
│   ├── seed.sql               ← Test data determinístico (7 users, 5 chars, 12 items, 3 monsters)
│   └── schema.sql             ← Snapshot legado (mantido para referência)
├── docs/                      ← Documentação markdown e HTML
│   ├── FEATURES.md
│   ├── DECISIONS.md
│   ├── DEV-LOCAL.md
│   ├── DIAGRAMAS-TECNICOS.md
│   ├── DIAGRAMAS-NAO-TECNICOS.md
│   └── skill-trees/           ← HTMLs originais das trees (fire.html, water.html, …)
├── tests/                     ← Unit tests (200 tests, game logic only)
├── Initial Files/             ← Ficheiros de referência do protótipo (legado)
├── netlify.toml               ← Config Netlify + headers COI em produção
├── package.json               ← Dependencies (serve, supabase-js, vitest)
├── vitest.config.js           ← Test configuration
├── .env.example               ← Template variáveis ambiente
├── README.md                  ← Este ficheiro (entry point)
├── CLAUDE.md                  ← Contexto para o agente Claude Code
└── .github/copilot-instructions.md  ← Contexto para GitHub Copilot
```

### Comandos

```bash
npm run dev        # Servidor local (porta 3000) — usa serve.json (headers COI)
npm test           # Correr testes unitários (200)
npm run test:watch # Testes em modo watch
npm run dev:all    # Supabase local + db:reset (seed) + dev (tudo numa linha)
```

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

- **Flexibilidade > Perfeição:** Priorize funcional sobre bem arquitetado
- **APIs em bypass:** Para dev local sem Supabase, as APIs retornam mocks (ver `public/js/api/`)
- **Estado atual:** Fases 1-6 completas. Próximos passos: Companheiros e integração Supabase.

---

## Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
