# Avatar RPG — Sistema de Personagem Web

> **Documentação Completa:**
> - [FEATURES.md](./FEATURES.md) — Todas as páginas e mecânicas (atuais e futuras)
> - [DIAGRAMAS-NÃO-TÉCNICOS.md](./DIAGRAMAS-NÃO-TÉCNICOS.md) — Fluxos e mecânicas do jogo
> - [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md) — Arquitetura, schema DB, APIs, schemas JSON
> - [DEV-LOCAL.md](./DEV-LOCAL.md) — Como correr localmente

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
| Fogo | ✅ Completo (JSON) |
| Água | ✅ Completo (JSON) |
| Terra | ⚠️ Pendente |
| Ar | ⚠️ Pendente |
| Sem Dobra | ⚠️ Pendente |

---

## Estado Atual e Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 1** | MVP (Ficha, Skill Tree visual, Loja mock, Hub mock) | 🟡 Em desenvolvimento |
| **Fase 2** | Economia e JSON (Ouro, Inventário, Import/Export, Loja funcional) | ⚪ Planeado |
| **Fase 3** | Grupo (Hub funcional, Recompensas, Trocas) | ⚪ Planeado |
| **Fase 4** | Admin (Gestão utilizadores, Backup/Restore) | ⚪ Backlog |
| **Futuro** | Moedas por nação, Subclasses, Companheiros | ⚪ Backlog |

### Implementado (Fase 1)
- ✅ Estrutura modular frontend (HTML + CSS + JS ES6 modules)
- ✅ Backend serverless (Netlify Functions + Supabase schema)
- ✅ Login por username (sem password) — bypass local ativo
- ✅ Ficha de personagem (atributos editáveis + stats derivados)
- ✅ Sistema de XP com level-up automático
- ✅ Skill tree visual (estrutura por categorias/tiers)
- ✅ Loja com dados mock (search + filtros)
- ✅ Hub de jogadores com dados mock
- ✅ Auto-save (debounce + diff + beforeunload + fallback localStorage)
- ✅ Import/Export JSON do personagem

---

## Estrutura do Projeto

```
avatar-rpg/
├── public/                    ← Frontend
│   ├── index.html             ← Página principal (SPA)
│   ├── css/
│   │   ├── main.css           ← Variables + base styles
│   │   └── components/        ← CSS por componente
│   └── js/
│       ├── main.js            ← Entry point (bootstrap)
│       ├── app.js             ← App class (orchestrator)
│       ├── api/               ← API client + endpoints
│       ├── auth/              ← AuthManager
│       ├── character/         ← Character, stats, XP, slots
│       ├── combat/            ← Dice, resolver, status effects
│       ├── hub/               ← Hub page + mock data
│       ├── items/             ← Item list + inventory
│       ├── shop/              ← Shop page + mock data
│       ├── skills/            ← Skill tree + cards + data loader
│       ├── storage/           ← AutoSave, import, export
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
├── package.json               ← Dependencies (serve, supabase-js)
├── .env.example               ← Template variáveis ambiente
└── DEV-LOCAL.md               ← Como correr localmente
```

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
- **Import system é prioridade (Fase 2):** Conteúdo gerado por IA deve ser plug-and-play
- **GM tools podem esperar:** Foque na experiência individual do jogador primeiro
- **APIs em bypass:** Para dev local sem Supabase, as APIs retornam mocks (ver `public/js/api/`)

---

## Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
