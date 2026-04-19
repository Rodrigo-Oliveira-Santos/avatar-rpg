# Avatar RPG — Sistema de Personagem Web

> **Documentação Completa:**
> - [FEATURES.md](./FEATURES.md) — Todas as páginas e mecânicas (atuais e futuras)
> - [DIAGRAMAS-NÃO-TÉCNICOS.md](./DIAGRAMAS-NÃO-TÉCNICOS.md) — Fluxos e mecânicas do jogo
> - [DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md) — Arquitetura, schema DB, APIs, schemas JSON

## Visão Geral

Sistema de RPG customizado inspirado em **Avatar: The Last Air Bender**, estilo D&D, com foco em:
- Distribuição de atributos (FOR, AGI, CHI, PER, RES, ESP)
- Progressão por níveis (máx 40)
- Desbloqueio de habilidades por elemento (Fogo, Água, Terra, Ar, Sem Dobra)
- Sistema de combate com dados, status effects e custos de Chi

**Público:** Você e seus amigos. Multi-usuário com autenticação simples (nome do personagem).

**Estado atual:** Protótipo com dados em `Initial Files/`. Próximo passo: construir a aplicação web funcional.

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

**Princípios de arquitetura:**
- Cada site é um módulo independente (pode ser desenvolvido/deployado separadamente)
- O Hub é uma camada de navegação que referencia os módulos
- Nenhum design específico necessário agora — apenas manter a estrutura flexível

**Estrutura sugerida para o futuro:**
```
portal/
├── hub/                 # Landing page com links para todos os sites
│   └── index.html
├── sites/
│   ├── avatar-rpg/      # Este projeto (mover para cá futuramente)
│   ├── site-2/          # Futuro projeto
│   └── site-3/          # Futuro projeto
└── shared/              # Recursos compartilhados (auth, utils, styles)
```

Para agora: desenvolver o Avatar RPG como projeto standalone. Manter a consciência de que a estrutura de pastas e caminhos devem ser fáceis de integrar num hub multi-site no futuro.

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
| Frontend | HTML + CSS + JS (ES6+) | Conhecido pela equipa, `avatar_rpg_v6.html` já está próximo do design final |
| Backend | Netlify Functions | Serverless, sem servidor dedicado, escala a zero (free) |
| Database | Supabase | Auth incluso, real-time, backups, 500MB free |
| Deploy | Netlify | Deploy automático do Git, custom domain free, functions incluídas |

---

## Sistema de Jogo

### Atributos

| Atributo | Descrição | Fórmula Derivada |
|----------|-----------|------------------|
| **FOR** (Força) | Dano físico, requisitos de armas | — |
| **AGI** (Agilidade) | Esquiva, velocidade | — |
| **CHI** (Chi) | Energia para habilidades | Chi máx = 6 + (nível×5) + (CHI×4) |
| **PER** (Percepção) | Precisão, detecção | — |
| **RES** (Resistência) | Defesa física | — |
| **ESP** (Espírito) | Vida espiritual, cura | Espírito máx = 8 + (nível×6) + (ESP×3) |

**Stats Derivados (fórmulas completas):**
- **Vida:** 10 + (nível × 8) + (FOR × 3)
- **Chi máx:** 6 + (nível × 5) + (CHI × 4)
- **Espírito máx:** 8 + (nível × 6) + (ESP × 3)
- **Defesa:** (RES × 2) + nível + bónus_armadura
- **Esquiva:** 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura

**Vida:** 10 + (nível × 8) + (FOR × 3)

### Progressão

- **Nível máximo:** 40
- **Pontos por nível:** 3 (distribuídos livremente)
- **XP para próximo nível:** `round(200 × (nível-1)^1.55)`
- **Marcos:** Aprendiz (5), Discípulo (10), Praticante (15), Veterano (20), Especialista (25), Mestre (30), Grande Mestre (35), Lendário (40)

### Habilidades

- Organizadas por **elemento** → **categoria** → **tier**
- **Categorias:** Espiritualidade, Agilidade, Combate Preciso, Combate Bruto
- **Tiers:** Iniciante (1), Avançado (2), Mestre (3), Lendário (4)
- **Requisitos:** Atributos mínimos + habilidades prévias desbloqueadas
- **Sub-habilidades:** 2 slots base + 1 a cada 3 níveis. Pergaminhos ultrapassam o cap de 3 por habilidade.

### Elementos

| Elemento | Status |
|----------|--------|
| Fogo | ✅ Completo (JSON + HTML) |
| Água | ✅ Completo (JSON + HTML) |
| Terra | ⚠️ Pendente (notas no JSON) |
| Ar | ⚠️ Pendente (notas no JSON) |
| Sem Dobra | ⚠️ Pendente (notas no JSON) |

---

## Funcionalidades Planejadas

> **Nota:** A lista completa e detalhada de features está em [FEATURES.md](./FEATURES.md).

### Resumo por Fase

| Fase | Descrição | Status |
|------|-----------|--------|
| **Fase 1** | MVP (Ficha, Skill Tree, Auto-save, Import/Export) | 🟡 Em desenvolvimento |
| **Fase 2** | Economia e Inventário (Ouro, Loja, Raridade, Armaduras) | ⚪ Planeado |
| **Fase 3** | Ferramentas de Grupo (Perfis, Recompensas, Trocas) | ⚪ Planeado |
| **Fase 4** | Moedas por Nação | ⚪ Backlog |
| **Fase 5** | Subclasses e Progressão | ⚪ Backlog |
| **Fase 6** | Sistema Avançado de Habilidades | ⚪ Backlog |
| **Fase 7** | Companheiros | ⚪ Em discussão |

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

### Outros Schemas Disponíveis

- **Item:** `item-import-v1` — Itens, armaduras, poções, materiais
- **Companheiro:** `companion-import-v1` — Pets/companheiros de personagem
- **Ataque:** `attack-import-v1` — Ataques standalone

---

## Estrutura do Projeto

### Estrutura Atual (Standalone)

```
avatar-rpg/
├── public/
│   ├── index.html          # Página principal (baseado em avatar_rpg_v6.html)
│   ├── css/
│   │   └── styles.css      # Estilos customizados
│   └── js/
│       ├── app.js          # Lógica principal
│       ├── character.js    # Gestão de personagem
│       ├── skill-tree.js   # Árvore de habilidades
│       └── api.js          # Chamadas ao backend (Netlify Functions)
├── netlify/
│   └── functions/
│       ├── auth.js         # Login/logout
│       ├── characters.js   # CRUD de personagens
│       └── import.js       # Importar/exportar JSON
├── database/
│   └── schema.sql          (tabelas Supabase)
├── Initial Files/
│   └── (arquivos atuais de referência)
├── netlify.toml            (configuração do Netlify)
└── README.md
```

### Estrutura Futura (Multi-Site Portal)

```
portal/
├── hub/
│   ├── index.html          # Landing page com navegação para todos os sites
│   └── css/
├── sites/
│   ├── avatar-rpg/         # Este projeto (reestruturar para cá)
│   │   ├── public/
│   │   ├── netlify/
│   │   └── ...
│   ├── site-2/             # Futuro projeto
│   └── site-3/             # Futuro projeto
└── shared/                 # Auth, utilities, styles comuns
    ├── auth/
    ├── utils/
    └── styles/
```

---

## Próximos Passos Imediatos

1. **Configurar repositório Git** com nova estrutura
2. **Criar projeto Supabase** (free tier) e configurar tabelas
3. **Adaptar `avatar_rpg_v6.html`** para a nova estrutura (HTML + CSS + JS modular)
4. **Configurar Netlify Functions** (criar `netlify.toml` e primeira função)
5. **Implementar login simples** (nome do personagem → session token via Supabase Auth)
6. **Criar ficha de personagem** com auto-save (debounce 2s)
7. **Exportar/Importar JSON**

---

## Notas de Desenvolvimento

- **Flexibilidade > Perfeição:** Priorize funcional sobre bem arquitetado. Refatore quando necessário.
- **Auto-save é crítico:** Usuário não deve precisar pensar em salvar.
- **Import system é prioridade:** Conteúdo gerado por IA deve ser plug-and-play (Fase 2).
- **GM tools podem esperar:** Foque na experiência individual do jogador primeiro.

---

## Contato / Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
