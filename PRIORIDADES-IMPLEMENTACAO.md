# Avatar RPG — Prioridades de Implementação

**Última atualização:** 2026-04-20  
**Status:** Documento de planeamento estratégico

---

## Visão Geral por Fases

Este documento organiza as implementações por ordem de prioridade e dependência. Cada fase constrói sobre a anterior.

```
FASE 1 (MVP) → FASE 2 (Economia) → FASE 3 (Grupo) → FASE 4 (Admin) → FUTURO
```

---

## 📍 FASE 1 — MVP (Em Desenvolvimento)

**Objetivo:** Sistema funcional mínimo para um jogador gerir o seu personagem.

### 1.1 Sistema de Autenticação (Crítico)
- [ ] Login simples por username (sem password)
- [ ] Sessão básica (localStorage + Supabase Auth mínimo)
- [ ] Redirecionamento automático para ficha do personagem

**Porquê primeiro:** Sem autenticação não há personagens, não há jogo.

### 1.2 Ficha de Personagem (Crítico)
- [ ] Atributos editáveis (FOR, AGI, CHI, PER, RES, ESP)
- [ ] Stats derivados calculados em tempo real (Vida, Chi, Espírito, Defesa, Esquiva)
- [ ] Sistema de distribuição de pontos (3 por nível)
- [ ] Nível máximo: 40
- [ ] Visualização clara de XP e progresso

**Dependência:** 1.1 Autenticação

### 1.3 Árvore de Habilidades Visual (Crítico)
- [ ] Estrutura visual da skill tree (categorias + tiers)
- [ ] Dados mock/exemplo (não precisa de todos os elementos completos)
- [ ] Sistema de desbloqueio básico (requisitos de atributos)
- [ ] Separação clara: Ataques vs Habilidades Passivas

**Nota:** Elementos completos vêm na Fase 2 via JSON.

### 1.4 Página de Loja (Visual Mock)
- [ ] Layout da loja implementado
- [ ] Dados de exemplo (hardcoded)
- [ ] Search bar funcional (sobre dados mock)
- [ ] Filtros básicos de categoria

**Porquê mock:** Economia real só na Fase 2.

### 1.5 Hub de Jogadores (Mock)
- [ ] Layout da página de perfis
- [ ] Dados de exemplo (3-5 personagens fictícios)
- [ ] Cards com: nome, nível, elemento, vida atual/máx
- [ ] **NOTA:** Sem dados reais nesta fase — apenas visual

**Dependência futura:** Liga-se à BD na Fase 3.

### 1.6 Estrutura de Pastas Reorganizada
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

**Porquê agora:** Mais fácil organizar desde o início do que refatorar depois.

---

## 📍 FASE 2 — Economia e Sistema de Dados (Próxima Prioridade)

**Objetivo:** Sistema de economia funcional + importação de dados via JSON.

### 2.1 Sistema de Ouro e Inventário
- [ ] Atributo `gold` no personagem
- [ ] Inventário com quantidades
- [ ] Equipamento de armaduras (slot único)
- [ ] Cálculo de defesa/esquiva com bónus de armadura

**Dependência:** 1.2 Ficha de Personagem

### 2.2 Importação JSON (GM)
- [ ] Upload de ficheiros JSON para habilidades
- [ ] Upload de ficheiros JSON para itens
- [ ] Validação de schema (client + server)
- [ ] Preview antes de importar
- [ ] Popular skill tree e loja a partir dos JSONs

**Schemas necessários:**
- `skill-import-v1`
- `item-import-v1`

### 2.3 Exportação JSON (Jogador)
- [ ] Exportar personagem completo (atributos, skills, inventário)
- [ ] Ficheiro pronto para partilha/backup

### 2.4 Loja Funcional
- [ ] Loja lê dados da BD (populados via JSON)
- [ ] Sistema de compra (deduz ouro, adiciona item)
- [ ] Raridade de itens (tag visual: Comum, Raro, Épico, Lendário)

**Nota:** Moeda única (Ouro) nesta fase. Nações vêm no Futuro.

### 2.5 Auto-Save (Opcional/Backlog)
- [ ] Debounce de 2s para alterações de atributos
- [ ] Deteção de mudanças reais (não salva se inalterado)
- [ ] Save ao fechar página (beforeunload)

**Status:** Backlog — híbrido de tempo + mudança + unload é suficiente por agora.

---

## 📍 FASE 3 — Ferramentas de Grupo

**Objetivo:** Funcionalidades sociais e ferramentas de GM.

### 3.1 Hub de Jogadores Funcional
- [ ] Lista real de personagens (da BD)
- [ ] Perfis simplificados (nome, nível, elemento, vida)
- [ ] Link para ficha completa (GM pode ver tudo)

### 3.2 Gestão de Grupo (GM Only)
- [ ] Recompensas de ouro em grupo (divide total pelo nº jogadores)
- [ ] Entrega individual de itens/ouro
- [ ] Log de ações do GM

### 3.3 Sistema de Troca
- [ ] Propor troca a outro jogador
- [ ] Notificações de troca pendente
- [ ] Aceitar/Recusar troca
- [ ] Transferência de itens/ouro

---

## 📍 FASE 4 — ADMIN e Gestão

**Objetivo:** Ferramentas de administração completa.

### 4.1 Role ADMIN
- [ ] Gerir utilizadores (criar, eliminar, editar)
- [ ] Promover/Despromover GMs
- [ ] Logs completos do sistema

### 4.2 Backup/Restore
- [ ] Exportar BD completa (JSON)
- [ ] Restaurar BD a partir de JSON
- [ ] Limpar dados globais (skills, itens)

---

## 🔮 FUTURO (Backlog de Longo Prazo)

### Economia Avançada
- [ ] 3 tipos adicionais de moedas (Prata, Bronze, Cobre)
- [ ] Distinção de moedas por nação (Fogo, Água, Terra, Ar)
- [ ] Filtros de nação na loja
- [ ] Restrições de compra por nação

### Sistema de Items
- [ ] Raridade com implicações mecânicas (não apenas visual)
- [ ] Armaduras com slots adicionais
- [ ] Bónus de atributos em items

### Habilidades e Progressão
- [ ] Subclasses desbloqueáveis (campo escondido até requisitos)
- [ ] Limites de habilidades por categoria/nível
- [ ] Pergaminhos para melhorar habilidades
- [ ] Sistema de slots de sub-habilidades (2 base + 1 a cada 3 níveis)

### Companheiros
- [ ] Página individual de companheiro
- [ ] Stats próprios (Vida, Ataque, Defesa)
- [ ] Progressão de nível
- [ ] Slots de armadura para companheiro

### Features de Troca Avançadas
- [ ] Sistema de "gifts" (entrega escondida)
- [ ] Trocas forçadas (GM apenas)
- [ ] Restrições de troca (em combate, imobilizado)

### Página de Inventário Dedicada
- [ ] Separar inventário da ficha de personagem
- [ ] Mais descrições e funções de gestão
- [ ] Organização por categorias

---

## Matriz de Dependências

```
1.1 Autenticação
    └─► 1.2 Ficha de Personagem
         └─► 2.1 Ouro/Inventário
              └─► 2.4 Loja Funcional
              └─► 3.3 Sistema de Troca

1.3 Skill Tree Visual
    └─► 2.2 Importação JSON (popula dados reais)

1.4 Loja Mock
    └─► 2.4 Loja Funcional

1.5 Hub Mock
    └─► 3.1 Hub Funcional

2.2 Importação JSON
    └─► 2.4 Loja Funcional
    └─► 1.3 Skill Tree (dados completos)

3.1 Hub Funcional
    └─► 3.2 Gestão de Grupo
```

---

## Critérios de "Pronto" por Fase

### Fase 1 (MVP) — Pronto quando:
- [ ] Utilizador faz login com username
- [ ] Vê e edita atributos do personagem
- [ ] Stats derivados atualizam em tempo real
- [ ] Vê skill tree visual (mesmo com dados mock)
- [ ] Vê loja com layout funcional (dados mock)
- [ ] Hub mostra exemplos de personagens

### Fase 2 (Economia) — Pronto quando:
- [ ] GM importa habilidades via JSON
- [ ] GM importa itens via JSON
- [ ] Loja mostra dados reais da BD
- [ ] Jogador compra itens (gasta ouro)
- [ ] Jogador equipa armadura (stats atualizam)
- [ ] Jogador exporta personagem para JSON

### Fase 3 (Grupo) — Pronto quando:
- [ ] Hub lista personagens reais
- [ ] GM dá recompensas de ouro
- [ ] Jogadores trocam itens entre si
- [ ] Notificações de troca funcionam

### Fase 4 (Admin) — Pronto quando:
- [ ] ADMIN cria utilizadores
- [ ] ADMIN promove/despromove GMs
- [ ] Backup/restore funcionais
- [ ] Logs de sistema acessíveis

---

## Notas de Arquitetura

### Restrições Netlify + Supabase (Free Tier)
- **Supabase:** 500MB storage limite → otimizar queries, evitar dados redundantes
- **Netlify Functions:** 125k invocações/mês → debounce no auto-save, caching no frontend
- **Bandwidth:** Monitorar tráfego de imagens/assets

### Decisões de Estrutura (Futuro)
```
# Estrutura atual (Fase 1)
public/
├── index.html
├── css/
└── js/

# Estrutura futura (pós-Fase 2)
public/
├── index.html          # Hub/landing page
├── avatar-rpg/         # Módulo Avatar RPG
│   ├── index.html
│   ├── css/
│   └── js/
├── future-module/      # Futuros módulos do portal
│   └── ...
```

---

## Legenda de Status

| Status | Significado |
|--------|-------------|
| ✅ | Implementado e funcional |
| 🚧 | Em desenvolvimento ativo |
| 📋 | Pronto para desenvolver (dependências resolvidas) |
| ⏳ | Aguardando dependências |
| 📦 | Backlog (longo prazo) |

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-04-20 | Documento inicial criado com prioridades e fases |
