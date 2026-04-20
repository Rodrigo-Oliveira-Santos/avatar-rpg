# Avatar RPG — Claude Code Context

**Última atualização:** 2026-04-20

## Project Overview

Web-based RPG character management system inspired by Avatar: The Last Airbender. Single-player focused with simple authentication (username only), skill trees, and JSON import/export.

**Contexto mais amplo:** Este é o primeiro "sub-projeto" de um portal web mais amplo. A arquitetura deve permitir que futuros sites/tools sejam adicionados como módulos independentes, com uma página inicial (landing/hub) para navegação entre eles.

## Current State

- **Prototype files:** `index.html`, `patch.js.txt` (monolithic HTML/JS)
- **Game data:** `Initial Files/*.json` (skill definitions for Fire, Water, Earth, Air, No-Bending)
- **Target:** Split into modern frontend/backend architecture

## Documentation

- **[FEATURES.md](./FEATURES.md)** — Todas as páginas e mecânicas (atuais e futuras)
- **[DIAGRAMAS-NÃO-TÉCNICOS.md](./DIAGRAMAS-NÃO-TÉCNICOS.md)** — Fluxos e mecânicas do jogo
- **[DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md)** — Arquitetura, schema DB, APIs, schemas JSON
- **[PRIORIDADES-IMPLEMENTACAO.md](./PRIORIDADES-IMPLEMENTACAO.md)** — Ordem de prioridades e dependências

## Tech Stack

- **Frontend:** HTML5 + CSS3 + JavaScript (ES6+) — sem frameworks, interface clean
- **Backend:** Netlify Functions (serverless) + Supabase (PostgreSQL + Auth)
- **Hosting:** Netlify (free tier)

## 🚧 Current Phase: MVP (Fase 1)

**Foco atual:** Sistema funcional mínimo para um jogador gerir o seu personagem.

| Feature | Status |
|---------|--------|
| Autenticação (username, sem password) | 🚧 |
| Ficha de personagem (atributos + stats) | 🚧 |
| Árvore de habilidades (estrutura visual, mock) | 🚧 |
| Loja (layout + mock) | 🚧 |
| Hub de Jogadores (mock) | 🚧 |

**Não incluído na Fase 1:**
- ❌ Auto-save (debounce 2s) — 📋 Backlog
- ❌ Importar/Exportar JSON — 📋 Fase 2
- ❌ Elementos completos — 📋 Fase 2 (via JSON)

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
- **Skill tiers:** 1-4 (Iniciado → Lendário)
- **Elementos:** Fogo, Água, Terra, Ar, Non-Bending

## Roles e Permissões

| Role | Descrição | Permissões Principais |
|------|-----------|----------------------|
| **JOGADOR** | Jogador normal | Editar ficha própria, ver árvore de habilidades, inventário próprio, comprar na loja, trocar com jogadores, exportar personagem (JSON) |
| **GM** | Game Master | Tudo do Jogador + ver TODAS as fichas, dar ouro/recompensas, gerir loja, entregar loot, importar JSON |
| **ADMIN** | Administrador (1-3 contas) | TUDO do GM + gerir utilizadores, promover/despromover GMs, backup/restore DB, logs completos, exportar dados completos |

**Notas:**
- Apenas ADMIN pode criar/promover utilizadores para GM
- Máximo de 2-3 contas ADMIN no sistema

## Development Priorities (Resumo)

### 🚧 Fase 1 — MVP (Atual)
1. Autenticação simples (username, sem password)
2. Ficha de personagem com atributos editáveis
3. Árvore de habilidades visual (mock)
4. Loja e Hub com dados de exemplo

### 📋 Fase 2 — Economia e JSON
1. Sistema de ouro e inventário
2. Importar/Exportar JSON (habilidades, itens, personagens)
3. Loja funcional (dados da BD)
4. Raridade de itens (visual)

### 📦 Fase 3 — Grupo
1. Hub de Jogadores funcional
2. Recompensas de ouro (GM)
3. Troca entre jogadores

### 📦 Fase 4 — Admin
1. Gestão de utilizadores
2. Backup/restore DB
3. Logs de sistema

### 🔮 Futuro
- Moedas por nação
- Subclasses desbloqueáveis
- Companheiros com stats próprios
- Página dedicada de inventário
- Sistema de "gifts" / trocas forçadas

## Working Style

- **Iterative development over perfect architecture** — MVP primeiro, otimizações depois
- **PT-PT** para texto visível ao utilizador
- **GM tools** devem ser intuitivos — o GM não gere inventário global, itens são "criados" quando entregues
- **ADMIN** deve ter controlo total mas com logs de todas as ações
- **Restrições Netlify + Supabase Free:** 500MB storage, 125k functions/mês

## Available Skills

As skills do Claude estão em `.claude/skills/`:
- `generate-skill-json.md` — Template para gerar JSON de habilidades
- `generate-item-json.md` — Template para gerar JSON de itens
- `validate-json.sh` — Validar ficheiros JSON
- `run-dev.sh` — Correr servidor de desenvolvimento
- `new-component.sh` — Criar novos componentes frontend (HTML/CSS/JS vanilla)

## Schemas de Importação

Ver [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md#9-schema-para-importação) para schemas completos:
- `skill-import-v1` — Habilidades
- `item-import-v1` — Itens, armaduras, poções
- `companion-import-v1` — Companheiros
- `attack-import-v1` — Ataques standalone
