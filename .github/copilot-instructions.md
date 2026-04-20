# Avatar RPG — GitHub Copilot Instructions

**Última atualização:** 2026-04-20

## Visão Geral do Projeto

Avatar RPG é um sistema de gestão de personagens web para um grupo de RPG inspirado em Avatar: The Last Airbender.

**Contexto mais amplo:** Este é o primeiro "sub-projeto" de um portal web mais amplo. A arquitetura deve permitir que futuros sites/tools sejam adicionados como módulos independentes, com uma página inicial (landing/hub) para navegação entre eles.

## Fase Atual: MVP (Fase 1)

**Foco:** Sistema funcional mínimo para um jogador gerir o seu personagem.

| Feature | Status |
|---------|--------|
| Autenticação (username, sem password) | 🚧 |
| Ficha de personagem (atributos + stats) | 🚧 |
| Árvore de habilidades (estrutura visual, mock) | 🚧 |
| Loja (layout + mock) | 🚧 |
| Hub de Jogadores (mock) | 🚧 |

**Não incluído na Fase 1:**
- ❌ Auto-save complexo (debounce 2s) — 📋 Backlog
- ❌ Importar/Exportar JSON — 📋 Fase 2
- ❌ Elementos completos — 📋 Fase 2 (via JSON)

## Arquitetura

- **Frontend:** HTML5 + CSS3 + JavaScript (ES6+) — sem frameworks
- **Backend:** Netlify Functions (serverless) + Supabase (PostgreSQL + Auth)
- **Hosting:** Netlify (free tier)

## Estrutura de Pastas

### Fase 1 (Atual)
```
public/
├── index.html
├── css/
│   ├── global.css
│   └── avatar-rpg/
│       ├── character.css
│       ├── skills.css
│       ├── inventory.css
│       ├── shop.css
│       └── hub.css
└── js/
    ├── app.js
    └── avatar-rpg/
        ├── character/
        ├── skills/
        ├── inventory/
        └── auth/
```

### Futuro (Pós-Fase 2)
```
public/
├── index.html          # Landing page / Hub do portal
├── avatar-rpg/         # Módulo Avatar RPG completo
│   ├── index.html
│   ├── css/
│   └── js/
└── future-module/      # Futuros módulos do portal
```

## Próximas Fases

### Fase 2 — Economia e JSON
- Sistema de ouro e inventário
- Importar/Exportar JSON (habilidades, itens, personagens)
- Loja funcional (dados da BD)
- Raridade de itens (visual)

### Fase 3 — Grupo
- Hub de Jogadores funcional
- Recompensas de ouro (GM)
- Troca entre jogadores

### Fase 4 — Admin
- Gestão de utilizadores
- Backup/restore DB
- Logs de sistema

### Futuro
- Moedas por nação
- Subclasses desbloqueáveis
- Companheiros com stats próprios
- Página dedicada de inventário
- Sistema de "gifts" / trocas forçadas

## Mecânicas do Jogo

### Atributos
| Atributo | Descrição |
|----------|-----------|
| **FOR** (Força) | Dano físico, requisitos de armas |
| **AGI** (Agilidade) | Esquiva, velocidade |
| **CHI** (Chi) | Energia para habilidades |
| **PER** (Percepção) | Precisão, detecção |
| **RES** (Resistência) | Defesa física |
| **ESP** (Espírito) | Vida espiritual, cura |

### Fórmulas de Stats Derivados
```javascript
vida: 10 + (nivel * 8) + (FOR * 3)
chiMax: 6 + (nivel * 5) + (CHI * 4)
espiritoMax: 8 + (nivel * 6) + (ESP * 3)
defesa: (RES * 2) + nivel + bonusArmadura
esquiva: 10 + ((AGI * 2) + PER) * 0.2 - penalidadeArmadura
```

### Progressão
- Nível máximo: 40
- Pontos por nível: 3
- XP para próximo nível: `round(200 × (nível-1)^1.55)`
- Skill tiers: 1-4 (Iniciante → Lendário)
- Elementos: Fogo, Água, Terra, Ar, Non-Bending

## Roles e Permissões

| Role | Permissões |
|------|------------|
| **JOGADOR** | Editar ficha própria, ver skills, inventário, comprar, trocar, exportar JSON |
| **GM** | Tudo do Jogador + ver todas as fichas, dar ouro/loot, gerir loja, importar JSON |
| **ADMIN** | TUDO do GM + gerir utilizadores, promover/despromover GMs, backup/restore DB |

**Notas:**
- Apenas ADMIN pode criar/promover utilizadores para GM
- Máximo de 2-3 contas ADMIN no sistema

## Guidelines de Código

### Estilo e Convenções
- JavaScript ES6+ (arrow functions, async/await, modules)
- CSS modular por componente
- PT-PT para texto visível ao utilizador
- Comentários apenas para lógica complexa (não para óbvio)

### Padrões Importantes
- Save híbrido: tempo + deteção de mudanças + beforeunload (Fase 1)
- Debounce de 2s para auto-save (Fase 2)
- Validação de schemas JSON no client e server

### Restrições Netlify + Supabase Free Tier
- Supabase: 500MB storage → otimizar queries
- Netlify Functions: 125k invocações/mês → debounce, caching
- Monitorar bandwidth de images/assets

## Documentação Completa

- `FEATURES.md` — Todas as páginas e mecânicas
- `DIAGRAMAS-NÃO-TÉCNICOS.md` — Fluxos e mecânicas do jogo
- `DIAGRAMAS-TÉCNICOS.md` — Arquitetura, schema DB, APIs
- `PRIORIDADES-IMPLEMENTACAO.md` — Ordem de prioridades
- `CLAUDE.md` — Contexto para Claude Code

## Schemas de Importação

Ver `DIAGRAMAS-TÉCNICOS.md` para schemas completos:
- `skill-import-v1` — Habilidades
- `item-import-v1` — Itens, armaduras, poções
- `companion-import-v1` — Companheiros
- `attack-import-v1` — Ataques standalone

## Available Skills

Skills do Copilot estão em `.copilot/skills/`:
- `generate-skill-json` — Template para gerar JSON de habilidades
- `generate-item-json` — Template para gerar JSON de itens
- `validate-json` — Validar ficheiros JSON
- `run-dev` — Correr servidor de desenvolvimento
- `new-component` — Criar novos componentes frontend
