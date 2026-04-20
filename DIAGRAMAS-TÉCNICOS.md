# Diagramas Técnicos — Avatar RPG

**Objetivo:** Documentação técnica da arquitetura, schema da base de dados, e fluxos de implementação.

**Legenda de Fases:**
- 🚧 Fase 1 (MVP — Em desenvolvimento)
- 📋 Fase 2 (Economia + JSON)
- 📦 Fase 3+ (Backlog)
- 🔮 Futuro (longo prazo)

---

## 1. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITETURA TÉCNICA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Netlify         │────▶│   Supabase      │
│   (HTML + CSS + │     │  Functions       │     │   (PostgreSQL   │
│   JavaScript)   │◀────│  (serverless)    │◀────│   + Auth)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
  Netlify (free)          Incluído no           Supabase (free tier)
                          Netlify               500MB storage

┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️  RESTRIÇÕES DE ARQUITETURA (Netlify + Supabase Free Tier)              │
│                                                                             │
│  • Supabase: 500MB storage → otimizar queries, evitar redundância          │
│  • Netlify Functions: 125k invocações/mês → debounce, caching no frontend  │
│  • Bandwidth: Monitorar tráfego de imagens/assets                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ESTRUTURA DE PASTAS — FASE 1 (ATUAL)                                       │
│                                                                             │
│  public/                                                                    │
│  ├── index.html          # Hub de navegação + SPA                          │
│  ├── css/                                                                   │
│  │   ├── global.css      # Estilos globais                                  │
│  │   └── avatar-rpg/     # Módulo Avatar RPG                                │
│  │       ├── character.css                                                  │
│  │       ├── skills.css                                                     │
│  │       ├── inventory.css                                                  │
│  │       ├── shop.css                                                       │
│  │       └── hub.css                                                        │
│  └── js/                                                                    │
│      ├── app.js          # Inicialização e estado global                   │
│      └── avatar-rpg/     # Módulo Avatar RPG                                │
│          ├── character/                                                     │
│          ├── skills/                                                        │
│          ├── inventory/                                                     │
│          └── auth/                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🔮 ESTRUTURA DE PASTAS — FUTURO (PÓS-FASE 2)                               │
│                                                                             │
│  public/                                                                    │
│  ├── index.html          # Landing page / Hub do portal                    │
│  ├── avatar-rpg/         # Módulo Avatar RPG (completo)                     │
│  │   ├── index.html      # Página principal do módulo                      │
│  │   ├── css/                                                               │
│  │   └── js/                                                                │
│  └── future-module/      # Futuros módulos do portal                        │
│      └── ...                                                                │
│                                                                             │
│  JUSTIFICATIVA: Estrutura modular permite adicionar novos sites/tools       │
│  como módulos independentes do portal.                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Schema da Base de Dados (Supabase)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEMA DO SUPABASE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🚧 FASE 1: TABELAS PRINCIPAIS (Foco Inicial)                            │
│──────────────────────────────────────────────────────────────────────────│
│                                                                          │
│  Prioridade: Users + Characters funcionais primeiro.                     │
│  Resto do schema é adicionado nas Fases 2-4.                             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: users (🚧 Fase 1)                                               │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  auth_id         UUID UNIQUE (Supabase Auth)                             │
│  username        VARCHAR(50) UNIQUE                                      │
│  role            VARCHAR(20) DEFAULT 'player'                            │
│                  CHECK (player, gm, admin)                               │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
│  updated_at      TIMESTAMP DEFAULT NOW()                                 │
│                                                                          │
│  NOTAS DE IMPLEMENTAÇÃO:                                                 │
│  • 🚧 Fase 1: Login sem password (apenas username)                       │
│  • Apenas ADMIN pode criar/promover utilizadores para GM                 │
│  • Máximo de 2-3 contas ADMIN no sistema                                 │
└──────────────────────────────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: characters (🚧 Fase 1)                                          │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  user_id         UUID REFERENCES users(id)                               │
│  name            VARCHAR(100)                                            │
│  element         VARCHAR(20) CHECK (fogo, agua, terra, ar, non_bending) │
│  level           INT DEFAULT 1 CHECK (level <= 40)                       │
│  xp              INT DEFAULT 0                                           │
│  xp_to_next      INT                                                     │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
│  updated_at      TIMESTAMP DEFAULT NOW()                                 │
│                                                                          │
│  -- Atributos base (Fase 1)                                              │
│  attr_for        INT DEFAULT 5                                           │
│  attr_agi        INT DEFAULT 5                                           │
│  attr_chi        INT DEFAULT 5                                           │
│  attr_per        INT DEFAULT 5                                           │
│  attr_res        INT DEFAULT 5                                           │
│  attr_esp        INT DEFAULT 5                                           │
│                                                                          │
│  -- Pontos disponíveis                                                   │
│  points_available INT DEFAULT 0                                          │
│                                                                          │
│  -- 📋 Fase 2: Economia                                                  │
│  gold            INT DEFAULT 0                                           │
│  armor_equipped  UUID REFERENCES items(id) NULL                          │
│                                                                          │
│  -- 🔮 Futuro                                                            │
│  gold_nation     VARCHAR(20) DEFAULT 'todas'                             │
│  companion_id    UUID REFERENCES companions(id) NULL                     │
│  subclass        VARCHAR(50) NULL                                        │
└──────────────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        │ 📋 Fase 2       │ 📋 Fase 2       │ 🔮 Futuro
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  character_  │  │  character_  │  │  companions  │
│  skills      │  │  inventory   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📋 FASE 2: TABELAS DE ECONOMIA E ITENS                                  │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: character_skills (📋 Fase 2)                                    │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  character_id    UUID REFERENCES characters(id) ON DELETE CASCADE        │
│  skill_id        UUID REFERENCES skills(id)                              │
│  unlocked_at     TIMESTAMP DEFAULT NOW()                                 │
│  level           INT DEFAULT 1                                           │
│  sub_skills      INT DEFAULT 0                                           │
│  UNIQUE(character_id, skill_id)                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: character_inventory (📋 Fase 2)                                 │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  character_id    UUID REFERENCES characters(id) ON DELETE CASCADE        │
│  item_id         UUID REFERENCES items(id)                               │
│  quantity        INT DEFAULT 1                                           │
│  acquired_from   VARCHAR(20) DEFAULT 'shop'                              │
│                  CHECK (shop, loot, trade, gm)                           │
│  acquired_at     TIMESTAMP DEFAULT NOW()                                 │
│  UNIQUE(character_id, item_id)                                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: skills (📋 Fase 2 — Global, carregado via JSON)                 │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  name            VARCHAR(100) UNIQUE                                     │
│  element         VARCHAR(20)                                             │
│  category        VARCHAR(30)                                             │
│  tier            INT CHECK (1-4)                                         │
│  description     TEXT                                                    │
│  requirements    JSONB  -- {FOR, AGI, CHI, PER, RES, ESP}                │
│  prerequisites   JSONB  -- ["skill_name_1", "skill_name_2"]             │
│  position        VARCHAR(10) CHECK (off, def, any, pass)                 │
│  attacks         JSONB                                                   │
│  passive_effect  JSONB                                                   │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: items (📋 Fase 2 — Global, carregado via JSON)                  │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  name            VARCHAR(100)                                            │
│  description     TEXT                                                    │
│  type            VARCHAR(30) CHECK (weapon, armor, potion, material,     │
│                                    other)                                │
│  rarity          VARCHAR(20) DEFAULT 'comum'                             │
│                  CHECK (comum, raro, epico, lendario)                    │
│  price           INT                                                     │
│  price_nation    VARCHAR(20) DEFAULT 'todas'                             │
│  weight_class    VARCHAR(10) CHECK (leve, medio, pesado)                 │
│  armor_class     INT NULL  -- Apenas para armaduras                      │
│  defense_bonus   INT DEFAULT 0                                           │
│  dodge_penalty   INT DEFAULT 0                                           │
│  attributes      JSONB  -- bónus de atributos {FOR: +2, AGI: -1}         │
│  in_shop         BOOLEAN DEFAULT FALSE                                   │
│  gm_notes        TEXT                                                    │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
│  updated_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: shop_config (📋 Fase 2)                                         │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  item_id         UUID REFERENCES items(id)                               │
│  price_override  INT NULL  -- NULL usa o preço base do item              │
│  nation_filter   VARCHAR(20) DEFAULT 'todas'                             │
│  is_active       BOOLEAN DEFAULT TRUE                                    │
│  updated_by      UUID REFERENCES users(id)                               │
│  updated_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📦 FASE 3-4: TABELAS DE GRUPO E ADMINISTRAÇÃO                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: companions (🔮 Futuro)                                          │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  character_id    UUID REFERENCES characters(id) ON DELETE CASCADE        │
│  name            VARCHAR(100)                                            │
│  animal_type     VARCHAR(50)                                             │
│  level           INT DEFAULT 1                                           │
│  hp_max          INT                                                     │
│  hp_current      INT                                                     │
│  attack          INT                                                     │
│  defense         INT                                                     │
│  armor_slots     INT DEFAULT 0                                           │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
│  updated_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: trade_proposals (📦 Fase 3)                                     │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  sender_id       UUID REFERENCES users(id)                               │
│  receiver_id     UUID REFERENCES users(id)                               │
│  items_offered   JSONB  -- [{item_id, quantity}]                         │
│  gold_offered    INT DEFAULT 0                                           │
│  status          VARCHAR(20) DEFAULT 'pending'                           │
│                  CHECK (pending, accepted, declined, expired)            │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
│  expires_at      TIMESTAMP                                               │
│  responded_at    TIMESTAMP NULL                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: notifications (📦 Fase 3)                                       │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  user_id         UUID REFERENCES users(id)                               │
│  type            VARCHAR(30) CHECK (trade, loot, gm_message, system)     │
│  title           VARCHAR(100)                                            │
│  message         TEXT                                                    │
│  is_read         BOOLEAN DEFAULT FALSE                                   │
│  related_id      UUID NULL  -- ID da trade/item relacionado              │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  TABELA: gm_actions (📦 Fase 4 — ADMIN)                                  │
│──────────────────────────────────────────────────────────────────────────│
│  id              UUID PRIMARY KEY                                        │
│  gm_id           UUID REFERENCES users(id)                               │
│  action_type     VARCHAR(30)                                             │
│  target_char_id  UUID REFERENCES characters(id) NULL                     │
│  details         JSONB                                                   │
│  created_at      TIMESTAMP DEFAULT NOW()                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Save (📋 Backlog)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE SAVE — FASE 1                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  📋 BACKLOG: AUTO-SAVE (2s Debounce)                                    │
│                                                                         │
│  Status: Não é crítico na Fase 1. Implementação posterior.              │
│                                                                         │
│  Sistema híbrido planeado:                                              │
│  • Save por tempo (debounce 2s)                                         │
│  • Deteção de mudanças reais (não salva se inalterado)                  │
│  • Save ao fechar página (beforeunload)                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🚧 FASE 1: SAVE MANUAL / CONTÍNUO                                      │
│                                                                         │
│  Implementação inicial mais simples:                                    │
│  • Save contínuo enquanto edita (sem debounce complexo)                 │
│  • Save explícito ao fechar página                                      │
│  • localStorage como backup temporário                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FLUXO DE AUTO-SAVE (Futuro — 📋 Backlog)                               │
│                                                                         │
│  Utilizador altera atributo                                             │
│         │                                                               │
│         ▼                                                               │
│  Clear timeout existente                                                │
│         │                                                               │
│         ▼                                                               │
│  Set novo timeout para 2000ms                                           │
│         │                                                               │
│         ▼ (aguarda 2s sem mudanças)                                     │
│  Timeout dispara → Serializa estado                                     │
│         │                                                               │
│         ▼                                                               │
│  PUT /api/characters/:id (Netlify Function)                             │
│         │                                                               │
│         ▼                                                               │
│  Supabase: UPDATE characters                                            │
│         │                                                               │
│         ▼                                                               │
│  Feedback visual: "Salvo!" (toast)                                      │
│                                                                         │
│  Código exemplo (simplificado):                                         │
│  let saveTimeout = null;                                                │
│  function handleAttributeChange() {                                     │
│    if (saveTimeout) clearTimeout(saveTimeout);                          │
│    saveTimeout = setTimeout(() => { saveCharacter(); }, 2000);          │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Fluxo de Importação JSON

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE IMPORTAÇÃO JSON                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  GM seleciona│
│  ficheiro    │
│  JSON        │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  1. LEITURA DO FICHEIRO                                                  │
│     const file = input.files[0];                                         │
│     const text = await file.text();                                      │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  2. PARSE DO JSON                                                        │
│     const data = JSON.parse(text);                                       │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  3. VALIDAÇÃO DE SCHEMA (validators.js)                                  │
│                                                                          │
│  validateSkillSchema(data)  // Para habilidades                          │
│  validateItemSchema(data)   // Para itens                                │
│                                                                          │
│  Verifica:                                                               │
│  - Campos obrigatórios presentes                                         │
│  - Tipos de dados corretos                                               │
│  - Valores dentro de ranges aceitáveis                                   │
│  - Referências válidas (prerequisites, etc.)                             │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ├─── Schema inválido ───▶ ┌─────────────────┐
       │                          │  Mostrar erro   │
       │                          │  ao utilizador  │
       │                          └─────────────────┘
       │
       │ Schema válido
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  4. PREVIEW DOS DADOS                                                    │
│     Renderizar preview no modal                                          │
│     [ Confirmar Importação ] [ Cancelar ]                                │
└──────────────────────────────────────────────────────────────────────────┘
       │
       │ Utilizador confirma
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  5. ENVIO PARA NETLIFY FUNCTION                                          │
│     POST /api/import/skills (ou /api/import/items)                       │
│     Body: { data, type: 'skills' | 'items' }                             │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  6. NETLIFY FUNCTION PROCESSA                                            │
│     - Valida autenticação (apenas GM)                                    │
│     - Valida schema novamente (server-side)                              │
│     - Prepara batch de inserção                                          │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  7. SUPABASE: UPSERT                                                     │
│     - Se skill/item já existe (pelo nome): UPDATE                        │
│     - Se não existe: INSERT                                              │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  8. FEEDBACK AO UTILIZADOR                                               │
│     ✅ "Importação concluída! X habilidades adicionadas."                │
│     ❌ "Erro na importação: [detalhes]"                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoints (Netlify Functions)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NETLIFY FUNCTIONS API                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🚧 FASE 1: ENDPOINTS ESSENCIAIS                                         │
│──────────────────────────────────────────────────────────────────────────│
│                                                                          │
│  Foco inicial: Auth + Characters. Apenas 1 personagem por user.          │
│  Redirecionamento automático para ficha do personagem após login.        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  AUTH (🚧 Fase 1)                                                        │
│──────────────────────────────────────────────────────────────────────────│
│  POST   /api/auth/login          # Login (username, sem password)        │
│  POST   /api/auth/logout         # Logout                                │
│  GET    /api/auth/me             # Verificar sessão atual                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  CHARACTERS (🚧 Fase 1)                                                  │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/characters/me       # Obter personagem do user atual        │
│  PUT    /api/characters/me       # Atualizar personagem (save)           │
│                                                                          │
│  🔮 Futuro:                                                              │
│  GET    /api/characters          # Listar todos (apenas GM)              │
│  GET    /api/characters/:id      # Obter personagem específico           │
│  POST   /api/characters          # Criar novo personagem                 │
│  DELETE /api/characters/:id      # Eliminar personagem                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📋 FASE 2: SKILLS E ITENS (via JSON)                                    │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  SKILLS (📋 Fase 2)                                                      │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/skills              # Listar todas as habilidades           │
│  GET    /api/skills/:element     # Filtrar por elemento                  │
│  POST   /api/skills/import        # Importar JSON (apenas GM)            │
│                                                                          │
│  🔮 Futuro:                                                              │
│  POST   /api/skills              # Criar habilidade (apenas GM)          │
│  PUT    /api/skills/:id          # Atualizar habilidade (apenas GM)      │
│  DELETE /api/skills/:id          # Eliminar habilidade (apenas GM)       │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  ITEMS (📋 Fase 2)                                                       │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/items               # Listar todos os itens                 │
│  GET    /api/items/shop          # Itens disponíveis na loja             │
│  POST   /api/items/import         # Importar JSON (apenas GM)            │
│                                                                          │
│  🔮 Futuro:                                                              │
│  POST   /api/items               # Criar item (apenas GM)                │
│  PUT    /api/items/:id           # Atualizar item (apenas GM)            │
│  DELETE /api/items/:id           # Eliminar item (apenas GM)             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  SHOP (📋 Fase 2)                                                        │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/shop/config         # Obter configuração da loja            │
│  PUT    /api/shop/config         # Atualizar configuração (apenas GM)    │
│  POST   /api/shop/purchase       # Comprar item                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  INVENTORY (📋 Fase 2)                                                   │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/inventory           # Obter inventário do personagem        │
│  PUT    /api/inventory/equip     # Equipar item (armadura)               │
│  POST   /api/inventory/trade     # Propor troca a outro jogador          │
│  PUT    /api/inventory/trade/:id # Responder a proposta de troca         │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📦 FASE 3: GM ACTIONS                                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  GM ACTIONS (📦 Fase 3)                                                  │
│──────────────────────────────────────────────────────────────────────────│
│  POST   /api/gm/reward-gold      # Dar ouro a grupo/jogador              │
│  POST   /api/gm/give-item        # Dar item a jogador                    │
│  GET    /api/gm/actions-log      # Ver log de ações do GM                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📦 FASE 4: ADMIN ACTIONS (apenas role ADMIN)                            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  ADMIN ACTIONS (📦 Fase 4)                                               │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/admin/users         # Listar todos os utilizadores          │
│  POST   /api/admin/users         # Criar novo utilizador                 │
│  PUT    /api/admin/users/:id     # Atualizar utilizador (role, etc.)     │
│  DELETE /api/admin/users/:id     # Eliminar utilizador                   │
│                                                                          │
│  POST   /api/admin/promote       # Promover a GM (apenas ADMIN)          │
│  POST   /api/admin/demote        # Despromover de GM (apenas ADMIN)      │
│                                                                          │
│  GET    /api/admin/backup        # Exportar DB completa (JSON)           │
│  POST   /api/admin/restore       # Restaurar DB a partir de JSON         │
│  POST   /api/admin/clear-data    # Limpar dados (habilidades, itens)     │
│                                                                          │
│  GET    /api/admin/system-logs   # Logs completos do sistema             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🔮 FUTURO: NOTIFICATIONS                                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  NOTIFICATIONS (🔮 Futuro)                                               │
│──────────────────────────────────────────────────────────────────────────│
│  GET    /api/notifications       # Obter notificações do utilizador      │
│  PUT    /api/notifications/:id   # Marcar notificação como lida          │
│                                                                          │
│  NOTA: Polling a cada 30s na Fase 3.                                    │
│  Futuro: WebSocket/Supabase Realtime para tempo real.                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Sistema de Notificações

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE NOTIFICAÇÕES                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  TIPOS DE NOTIFICAÇÃO                                                   │
│                                                                         │
│  ┌───────────────┬──────────────────────────────────────────────────┐   │
│  │  Tipo         │  Gatilho                                         │   │
│  ├───────────────┼──────────────────────────────────────────────────┤   │
│  │  trade        │  Jogador recebe proposta de troca                │   │
│  │  loot         │  GM entrega item/ouro ao jogador                 │   │
│  │  gm_message   │  GM envia mensagem direta                        │   │
│  │  system       │  Notificações do sistema (backup, etc.)          │   │
│  └───────────────┴──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FLUXO: JOGADOR RECEBE PROPOSTA DE TROCA                                │
│                                                                         │
│  1. Jogador A envia proposta (POST /api/inventory/trade)               │
│  2. Sistema cria registo em trade_proposals (status: pending)          │
│  3. Sistema cria notificação para Jogador B                            │
│  4. Jogador B vê notificação no UI (ícone com badge)                   │
│  5. Jogador B clica → Modal com detalhes da proposta                   │
│  6. Jogador B decide: [Aceitar] [Recusar]                              │
│  7. Sistema atualiza trade_proposals (status: accepted/declined)       │
│  8. Se aceite:                                                          │
│     - Transfere itens/ouro entre personagens                            │
│     - Cria notificação de confirmação para ambos                        │
│  9. Se recusado:                                                        │
│     - Notificação de "troca recusada" para Jogador A                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  IMPLEMENTAÇÃO SUGERIDA                                                 │
│                                                                         │
│  Frontend:                                                              │
│  - Polling a cada 30s: GET /api/notifications                          │
│  - Badge no ícone de notificações (não lidas)                          │
│  - Toast notification quando nova notificação chega                     │
│                                                                         │
│  Futuro (WebSocket/Real-time):                                          │
│  - Supabase Realtime para notificações em tempo real                   │
│  - Push notifications (se PWA)                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Sistema de Stats Derivados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CÁLCULO DE STATS DERIVADOS                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FÓRMULAS ATUAIS                                                        │
│                                                                         │
│  VIDA         = 10 + (nível × 8) + (FOR × 3)                            │
│  CHI_MAX      = 6 + (nível × 5) + (CHI × 4)                             │
│  ESPIRITO_MAX = 8 + (nível × 6) + (ESP × 3)                            │
│  DEFESA       = (RES × 2) + nível + bónus_armadura                      │
│  ESQUIVA      = 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FLUXO DE CÁLCULO (stats.js)                                            │
│                                                                         │
│  function calculateDerivedStats(character) {                            │
│    const { level, attr_for, attr_agi, attr_chi, attr_per,              │
│          attr_res, attr_esp, armor_equipped } = character;             │
│                                                                         │
│    // Bónus da armadura                                                 │
│    const armorBonus = armor_equipped?.defense_bonus || 0;              │
│    const dodgePenalty = armor_equipped?.dodge_penalty || 0;            │
│                                                                         │
│    return {                                                             │
│      hp_max: 10 + (level * 8) + (attr_for * 3),                        │
│      chi_max: 6 + (level * 5) + (attr_chi * 4),                        │
│      spirit_max: 8 + (level * 6) + (attr_esp * 3),                     │
│      defense: (attr_res * 2) + level + armorBonus,                     │
│      dodge: 10 + ((attr_agi * 2) + attr_per) * 0.2 - dodgePenalty      │
│    };                                                                   │
│  }                                                                      │
│                                                                         │
│  // Recalcular sempre que:                                              │
│  - Atributos mudam                                                      │
│  - Nível muda                                                           │
│  - Armadura é equipada/removida                                         │
│  - Bónus da armadura muda                                               │
│  └─────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Sistema de XP e Níveis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROGRESSÃO DE NÍVEL                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FÓRMULA DE XP                                                          │
│                                                                         │
│  XP para próximo nível = round(200 × (nível-1)^1.55)                   │
│                                                                         │
│  Nível  →  XP Total      │  Nível  →  XP Total                          │
│  1      →  0             │  21     →  56,847                            │
│  2      →  200           │  22     →  64,521                            │
│  3      →  628           │  23     →  72,764                            │
│  4      →  1,236         │  24     →  81,591                            │
│  5      →  2,000         │  25     →  91,018  (Veterano)                │
│  6      →  2,904         │  26     →  101,059                           │
│  ...                          ...                                       │
│  10     →  6,324         │  30     →  143,354 (Mestre)                  │
│  15     →  14,539        │  35     →  203,291 (Grande Mestre)           │
│  20     →  28,000        │  40     →  288,000 (Lendário)                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  MARCOS DE NÍVEL (Títulos)                                              │
│                                                                         │
│  Nível 5   →   Aprendiz                                                │
│  Nível 10  →   Discípulo                                               │
│  Nível 15  →   Praticante                                              │
│  Nível 20  →   Veterano                                                │
│  Nível 25  →   Especialista                                            │
│  Nível 30  →   Mestre                                                   │
│  Nível 35  →   Grande Mestre                                           │
│  Nível 40  →   Lendário                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PONTOS DE ATRIBUTO POR NÍVEL                                           │
│                                                                         │
│  - Cada nível: +3 pontos para distribuir                                │
│  - Nível máximo: 40                                                     │
│  - Total de pontos distribuíveis: 39 × 3 = 117 pontos                   │
│  - Stats base (nível 1): FOR 5, AGI 5, CHI 5, PER 5, RES 5, ESP 5      │
│  - Stats máximos possíveis (teórico): todos a ~24 (se distribuído       │
│    igualmente) ou valores extremos se focado num único atributo         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Schema JSON para Importação

### 9.1 Schema de Habilidade

```json
{
  "$schema": "skill-import-v1",
  "element": "fogo|agua|terra|ar|non_bending",
  "category": "spirit|agility|precise_combat|brute_combat",
  "tier": 1|2|3|4,
  "name": "Nome da Habilidade",
  "description": "Descrição curta da habilidade (1-2 frases)",
  "requirements": {
    "FOR": 0,
    "AGI": 0,
    "CHI": 0,
    "PER": 0,
    "RES": 0,
    "ESP": 0
  },
  "prerequisites": ["Nome Habilidade 1", "Nome Habilidade 2"],
  "position": "off|def|any|pass",
  "attacks": [
    {
      "name": "Nome do Ataque",
      "description": "Descrição do efeito do ataque",
      "damage": "2d6+2",
      "chi_cost": 3,
      "status_effects": ["burn", "stun"]
    }
  ],
  "passive_effect": {
    "type": "buff|debuff|restore|heal|move|utility",
    "dice": "1d6",
    "chi_cost": 2,
    "description": "Descrição do efeito passivo",
    "status_effects": ["regen"],
    "duration": 3
  }
}
```

### 9.2 Schema de Item

```json
{
  "$schema": "item-import-v1",
  "name": "Nome do Item",
  "description": "Descrição do item",
  "type": "weapon|armor|potion|material|other",
  "rarity": "comum|raro|epico|lendario",
  "price": 100,
  "price_nation": "fogo|agua|terra|ar|todas",
  "weight_class": "leve|medio|pesado",
  "armor_class": null,
  "defense_bonus": 5,
  "dodge_penalty": 2,
  "attributes": {
    "FOR": 0,
    "AGI": 0,
    "CHI": 0,
    "PER": 0,
    "RES": 0,
    "ESP": 0
  },
  "in_shop": true,
  "gm_notes": "Notas internas do GM"
}
```

### 9.3 Schema de Companheiro

```json
{
  "$schema": "companion-import-v1",
  "name": "Nome do Companheiro",
  "animal_type": "lobo|falcão|urso|dragão|outro",
  "base_stats": {
    "hp_max": 50,
    "attack": 10,
    "defense": 8
  },
  "level_scaling": {
    "hp_per_level": 5,
    "attack_per_level": 2,
    "defense_per_level": 1
  },
  "armor_slots": 0,
  "abilities": [
    {
      "name": "Nome da Habilidade",
      "description": "Descrição",
      "type": "passive|active"
    }
  ]
}
```

### 9.4 Schema de Ataque (Standalone)

```json
{
  "$schema": "attack-import-v1",
  "name": "Nome do Ataque",
  "description": "Descrição do ataque",
  "damage_formula": "2d6+2",
  "chi_cost": 3,
  "range": "melee|short|medium|long",
  "area_of_effect": "single|line|cone|burst",
  "status_effects": [
    {
      "type": "burn",
      "chance": 0.5,
      "duration": 2,
      "damage_per_turn": "1d4"
    }
  ],
  "requirements": {
    "element": "fogo",
    "minimum_tier": 2
  }
}
```

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-04-19 | Diagramas técnicos iniciais criados |
