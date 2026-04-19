# Avatar RPG — Copilot Instructions

## Project Overview
Web-based RPG character management system inspired by Avatar: The Last Airbender. Single-player focused with simple authentication (character name), skill trees, and JSON import/export.

**Contexto mais amplo:** Este é o primeiro "sub-projeto" de um portal web mais amplo. A arquitetura deve permitir que futuros sites/tools sejam adicionados como módulos independentes, com uma página inicial (landing/hub) para navegação entre eles.

## Current State
- **Prototype files:** `index.html`, `patch.js.txt` (monolithic HTML/JS)
- **Game data:** `Initial Files/*.json` (skill definitions for Fire, Water, Earth, Air, No-Bending)
- **Target:** Split into modern frontend/backend architecture

## Documentation
- **[FEATURES.md](./FEATURES.md)** — Todas as páginas e mecânicas (atuais e futuras)
- **[DIAGRAMAS-NÃO-TÉCNICOS.md](./DIAGRAMAS-NÃO-TÉCNICOS.md)** — Fluxos e mecânicas do jogo
- **[DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md)** — Arquitetura, schema DB, APIs, schemas JSON

## Tech Stack
- **Frontend:** HTML5 + CSS3 + JavaScript (ES6+) — sem frameworks, interface clean
- **Backend:** Netlify Functions (serverless) + Supabase (PostgreSQL + Auth)
- **Deploy:** Netlify (frontend + functions), Supabase (free tier, 500MB)

## Key Game Mechanics

### Attributes
| Atributo | Descrição |
|----------|-----------|
| **FOR** (Força) | Dano físico, requisitos de armas |
| **AGI** (Agilidade) | Esquiva, velocidade |
| **CHI** (Chi) | Energia para habilidades |
| **PER** (Percepção) | Precisão, detecção |
| **RES** (Resistência) | Defesa física |
| **ESP** (Espírito) | Vida espiritual, cura |

### Derived Stats (Fórmulas Atuais)
- **Vida:** 10 + (nível × 8) + (FOR × 3)
- **Chi máx:** 6 + (nível × 5) + (CHI × 4)
- **Espírito máx:** 8 + (nível × 6) + (ESP × 3)
- **Defesa:** (RES × 2) + nível + bónus_armadura
- **Esquiva:** 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura

### Progression
- **Nível máximo:** 40
- **Pontos por nível:** 3 (distribuídos livremente)
- **XP para próximo nível:** `round(200 × (nível-1)^1.55)`
- **Skill tiers:** 1-4 (Iniciante → Lendário)
- **Elementos:** Fogo, Água, Terra, Ar, Non-Bending

### Economy (Em desenvolvimento)
- **Moedas:** Ouro (base), futuro: 3 tipos adicionais + distinção por nação
- **Raridade de itens:** Comum, Raro, Épico, Lendário
- **Armaduras:** Slot único, com bónus de defesa e penalidade de esquiva

## Roles e Permissões

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| **JOGADOR** | Jogador normal | Editar ficha própria, ver árvore de habilidades, inventário próprio, comprar na loja, trocar com jogadores, exportar personagem (JSON) |
| **GM** | Game Master | Tudo do Jogador + ver TODAS as fichas, dar ouro/recompensas, gerir loja, entregar loot, importar JSON |
| **ADMIN** | Administrador (1-3 contas) | TUDO do GM + gerir utilizadores, promover/despromover GMs, backup/restore DB, logs completos, exportar dados completos |

**Notas:**
- Apenas ADMIN pode criar/promover utilizadores para GM
- Máximo de 2-3 contas ADMIN no sistema
- ADMIN pode exportar base de dados completa para backup

## Development Priorities

### Fase 1 — MVP (Em desenvolvimento)
1. Ficha de personagem com atributos editáveis
2. Árvore de habilidades por elemento
3. Auto-save (debounce 2s)
4. Exportar personagem para JSON (jogador)

### Fase 2 — Economia e Inventário
1. Sistema de ouro e inventário
2. Loja (visão jogador + GM)
3. Raridade de itens
4. Armaduras com bónus/penalidade

### Fase 3 — Ferramentas de Grupo
1. Página de perfis simplificados
2. Recompensas de ouro (GM)
3. Troca entre jogadores com notificações

### Fase 4 — ADMIN e Gestão
1. Role ADMIN com permissões completas
2. Gestão de utilizadores
3. Backup/restore da base de dados
4. Logs de sistema

### Futuro
- Moedas por nação
- Subclasses desbloqueáveis
- Companheiros com stats próprios
- Limites de habilidades por categoria/nível

## Working Style
- Iterative development over perfect architecture
- Auto-save is critical (2s debounce)
- Content import must be plug-and-play (schemas em DIAGRAMAS-TÉCNICOS.md)
- Portuguese (PT-BR) preferred for user-facing text
- GM tools should be intuitive — o GM não gere inventário global, itens são "criados" quando entregues
- ADMIN role deve ter controlo total mas com logs de todas as ações

## Available Skills

As skills estão em `.copilot/skills/`:
- `generate-skill-json` — Template para gerar JSON de habilidades
- `generate-item-json` — Template para gerar JSON de itens
- `validate-json` — Validar ficheiros JSON do projeto
- `run-dev` — Correr servidor de desenvolvimento
- `new-component` — Criar novos componentes frontend (HTML/CSS/JS)

## Schemas de Importação

Ver [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md#9-schema-para-importação) para schemas completos:
- `skill-import-v1` — Habilidades
- `item-import-v1` — Itens, armaduras, poções
- `companion-import-v1` — Companheiros
- `attack-import-v1` — Ataques standalone

## Frontend File Structure

```
public/
├── index.html          # Página única (SPA-like)
├── css/
│   ├── main.css        # Estilos globais
│   └── components/     # Componentes modulares
│       ├── nav-tabs.css
│       ├── attr-panel.css
│       ├── stat-bars.css
│       ├── skill-card.css
│       ├── item-card.css
│       └── character-section.css
└── js/
    ├── app.js          # Inicialização e estado global
    ├── main.js         # Event listeners e UI bindings
    ├── character/      # Lógica de personagem
    │   ├── Character.js
    │   ├── stats.js
    │   ├── xp.js
    │   └── slots.js
    ├── skills/         # Sistema de habilidades
    │   ├── data.js
    │   ├── SkillCard.js
    │   ├── SkillTree.js
    │   └── index.js
    ├── items/          # Sistema de inventário e itens
    │   ├── inventory.js
    │   ├── ItemList.js
    │   └── index.js
    ├── storage/        # Persistência (auto-save, import/export)
    │   ├── autosave.js
    │   ├── export.js
    │   ├── import.js
    │   └── index.js
    └── utils/          # Utilitários
        ├── constants.js
        ├── dom.js
        ├── validators.js
        └── index.js
```

## API Endpoints (Netlify Functions)

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/characters
POST   /api/characters
GET    /api/characters/:id
PUT    /api/characters/:id      # auto-save endpoint
DELETE /api/characters/:id
GET    /api/characters/all      # GM only

GET    /api/skills
GET    /api/skills/:element
POST   /api/skills              # GM only
PUT    /api/skills/:id          # GM only
DELETE /api/skills/:id          # GM only

GET    /api/items
GET    /api/items/shop
POST   /api/items               # GM only
PUT    /api/items/:id           # GM only

POST   /api/gm/reward-gold
POST   /api/gm/give-item
POST   /api/gm/import
GET    /api/gm/actions-log

GET    /api/admin/users         # ADMIN only
POST   /api/admin/promote       # ADMIN only
GET    /api/admin/backup        # ADMIN only
POST   /api/admin/restore       # ADMIN only
GET    /api/admin/system-logs   # ADMIN only
```
