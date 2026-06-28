# Avatar RPG — Documento de Features

**Última atualização:** 2026-06-26  
**Status:** Documento de referência

**Legenda:**
- ✅ Implementado
- 🔮 Futuro (backlog)
- ⚠️ Decisão pendente — ver [`DECISIONS.md`](./DECISIONS.md)

---

## Notas recentes (2026-06-26)

- ✅ Botão MAX agora é específico por recurso: `HP-MAX`, `SP-MAX`, `CP-MAX` independentes.
- ✅ Esquiva limitada a **15** (cap em `utils/constants.js` → `STAT_CAPS.dodge`).
- ⚠️ Tetos máximos de Vida/Espírito/Chi/Defesa configuráveis em `STAT_CAPS` mas com valores por definir.
- ✅ Apenas o GM concede XP (botão de XP desaparece para players).
- ✅ Moedas nacionais já não dependem do elemento do jogador.
- ✅ GM/Admin não têm ficha de personagem (abas `character`/elementos/`items` ocultas).
- ✅ Hub do GM mostra todos os jogadores registados, mesmo sem ficha guardada.
- ✅ Modo opcional de persistência Supabase local (ver [`DEV-LOCAL.md`](./DEV-LOCAL.md)).

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Páginas do Sistema](#páginas-do-sistema)
3. [Mecânicas Principais](#mecânicas-principais)
4. [Features por Fase](#features-por-fase)
5. [Diagramas](#diagramas)
6. [Histórico de Alterações](#histórico-de-alterações)
7. [🔮 Backlog (Futuro)](#-backlog-futuro)

---

## Visão Geral

Avatar RPG é um sistema de gestão de personagens web para um grupo de RPG inspirado em Avatar: The Last Airbender. O sistema suporta múltiplos jogadores, um GM (Game Master) com ferramentas de gestão, e uma role ADMIN com acesso total.

**Princípios de design:**
- Design iterativo sobre arquitetura perfeita
- Conteúdo importado via JSON
- PT-PT para texto visível ao utilizador
- Estrutura preparada para evolução do portal e dos seus módulos

---

## Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| **JOGADOR** | Jogador normal | Ver/editar ficha própria, ver árvore de habilidades, ver inventário próprio, comprar na loja, trocar com outros jogadores, exportar personagem para JSON |
| **GM** | Game Master | Tudo do Jogador + ver TODAS as fichas (visão expandida), dar ouro/recompensas, gerir loja, entregar loot individual, importar JSON (habilidades, itens, ataques) |
| **ADMIN** | Administrador (1-3 contas) | TUDO do GM + gerir utilizadores (criar/eliminar), promover/despromover GMs, limpar dados, backups, restore, acesso a logs completos, exportar base de dados completa |

**Nota:** A role ADMIN é limitada a 2-3 contas. Apenas ADMIN pode criar novas contas GM.

---

## Páginas do Sistema

### 1. Página de Ficha de Personagem (Principal)

**Público:** Jogador (edição completa), GM (visualização)

**Funcionalidades:**
- Atributos editáveis (FOR, AGI, CHI, PER, RES, ESP)
- Distribuição de pontos (3 pontos por nível, máx nível 40)
- Visualização de stats derivados (Vida, Chi Max, Espírito Max, Defesa, Esquiva)
- Equipamento funcional (incluindo armadura com impacto nos stats)
- Secção de inventário integrada na ficha
- Ouro visível e atualizado em tempo real
- Acesso rápido a dados do personagem, equipamento e progressão
- Companheiro (link para página individual) — 🔮 Futuro

**Stats derivados (fórmulas atuais):**
| Stat | Fórmula |
|------|---------|
| Vida | 10 + (nível × 8) + (FOR × 3) |
| Chi Max | 6 + (nível × 5) + (CHI × 4) |
| Espírito Max | 8 + (nível × 6) + (ESP × 3) |
| Defesa | RES × 2 + nível + bónus_armadura |
| Esquiva | 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura |

**Estado:** ✅ Implementado

---

### 2. Página de Árvore de Habilidades

**Público:** Jogador

**Funcionalidades implementadas:**
- Estrutura visual organizada por categoria (Espiritualidade, Agilidade, Combate Preciso, Combate Bruto)
- Tiers de 1-4 (Iniciante → Lendário)
- Requisitos visíveis (atributos, nível, habilidades prévias)
- Habilidades carregadas via JSON com dados reais
- Importação JSON a alimentar a árvore com conteúdos dos 5 elementos

**Futuro (🔮):**
- Pergaminhos para melhorar habilidades
- Limites de desbloqueio por categoria/nível
- Slots de sub-habilidades

**Regras previstas:**
- Personagem só pode selecionar habilidades do seu elemento
- Subclasses escondidas até cumprir requisitos (nível + atributos + habilidade prévia)

**Estado:** ✅ Implementado

---

### 3. Página de Perfil Simplificado (Hub de Jogadores)

**Público:** Todos os jogadores (visão simplificada), GM (visão expandida)

**Funcionalidades implementadas:**

| Visão | Funcionalidades |
|-------|-----------------|
| **Jogador (simplificada)** | Nome, Vida atual/máx, Buffs/Debuffs ativos, Elemento, dados reais via localStorage |
| **GM (expandida)** | Inventário completo, stats detalhados, histórico de loot, link para ficha completa e acesso à ficha integral do personagem |

**Notas de implementação:**
- O Hub usa dados reais guardados em localStorage por utilizador.
- O sistema de troca está ativo e integrado com a experiência de grupo.
- Hub de Jogadores e Gestão de Grupo são a mesma página. GM vê secção adicional de gestão (ver secção 4).

**Estado:** ✅ Implementado

---

### 4. Página de Gestão de Grupo (GM Only)

**Público:** GM

**Nota:** Esta página é uma extensão do Hub de Jogadores (Secção 3). GM vê uma secção adicional com ferramentas de gestão.

**Funcionalidades implementadas:**
- Lista de todos os jogadores ativos
- Recompensas de ouro em grupo (valor total dividido igualmente)
- Entrega individual de itens/ouro a jogadores específicos
- Gestão da loja (selecionar itens disponíveis e gerir disponibilidade)
- Sistema de troca e entrega de loot em funcionamento

**Fluxo de recompensa em grupo:**
```
GM insere valor total → Sistema divide pelo nº de jogadores → Cada jogador recebe a sua parte
```

**Estado:** ✅ Implementado

---

### 5. Página de Loja

**Público:** Jogador (compra), GM (gestão)

**Funcionalidades implementadas:**

| Visão | Funcionalidades |
|-------|-----------------|
| **Jogador** | Search bar, filtros por categoria, itens reais/importados, preços em Ouro, raridade visual, compras funcionais |
| **GM** | Selecionar itens para loja, alterar preços, gerir catálogo disponível |

**Futuro (🔮):**
- Raridade com implicações mecânicas (não apenas visual)
- Filtro de nação da moeda
- Moedas por nação (Fogo, Água, Terra, Ar)

**Estado:** ✅ Implementado

---

### 6. Página de Inventário

**Público:** Jogador

**Nota de Implementação:** O inventário está integrado na Ficha de Personagem (Secção 1), não é uma página separada.

**Funcionalidades implementadas:**
- Lista de itens possuídos (com quantidades)
- Ouro atual
- Equipar armaduras (slot único)
- Sistema de troca com outros jogadores

**Futuro (🔮):**
- Página própria de inventário com mais descrições e funções
- Organização por categorias
- Filtros e busca avançada
- Histórico completo de aquisições

**Estado:** ✅ Implementado (integrado na ficha)

---

### 7. Página de Companheiros

**Público:** Jogador

**Funcionalidades (🔮 Futuro):**
- Stats básicos (Vida, Ataque, Defesa)
- Tipo de animal
- Link para página do personagem principal
- Slots de armadura para companheiro
- Progressão de nível do companheiro

**Estado:** 🔮 Futuro (backlog)

---

### 8. Página de Importação/Exportação JSON

**Público:** GM (importação), ADMIN (importação/exportação completa), Jogador (exportação própria)

**Funcionalidades implementadas:**

| Role | Funcionalidades |
|------|-----------------|
| **GM** | Página de importação com drag & drop, carregamento de JSON de habilidades/itens/ataques, validação de schema, preview antes de importar |
| **Jogador** | Exportar personagem completo (atributos, habilidades, inventário) |
| **ADMIN** | Exportar base de dados completa (backup JSON), exportar habilidades/itens, importar dados em bulk, backup/restore |

**Estado:** ✅ Implementado

---

## Mecânicas Principais

### Sistema de Economia

**Implementado:**
- Tipo base: Ouro (única moeda ativa)
- Sistema de inventário com quantidades
- Armaduras com bónus de defesa e penalidade de esquiva
- Loja funcional com compras a ouro
- Recompensas de grupo e entrega individual de loot/ouro
- Transações entre jogadores com sistema de troca ativo
- Notificações de troca

**Futuro (🔮):**
- Distinção por nação (Fogo, Água, Terra, Ar)
- Regra de nação: moedas apenas podem ser gastas na nação correspondente
- O GM define quais moedas são aceites em cada loja
- Sistema de "gifts" / trocas forçadas (GM)

---

### Sistema de Raridade de Itens

**Implementado:**
- Tiers: Comum, Raro, Épico, Lendário
- Badges/indicadores visuais na apresentação do item
- Sem implicações mecânicas diretas

**Futuro (🔮):**
- Raridade com implicações mecânicas (bónus de stats, preço multiplicado)
- Ver DIAGRAMAS-NÃO-TÉCNICOS.md Secção 6 para detalhes

**Implementação:** Campo `rarity` no JSON do item. Balanceamento feito pelo GM através de atributos e preço.

---

### Sistema de Armaduras

- Slot único de armadura
- Valor fixo de bónus de defesa (definido pelo GM)
- Valor fixo de penalidade de esquiva (definido pelo GM)
- Aplicação em tempo real nos stats do personagem

---

### Sistema de Subclasses

**Requisitos (exemplo):**
- Nível mínimo de personagem
- Atributos mínimos (ex: CHI 10, PER 5)
- Habilidade prévia desbloqueada

**Regras previstas:**
- Campo escondido até cumprir requisitos
- Subclasses associadas a um dos 5 elementos
- Sem subclasses transversais

**Estado:** 🔮 Futuro (backlog)

---

### Sistema de Habilidades

**Requisitos de desbloqueio:**
- Atributos mínimos
- Nível mínimo
- Habilidades prévias desbloqueadas

**Futuro (🔮):**
- Limite de habilidades por categoria
- Limite de habilidades por tier/nível
- Pergaminhos para melhorar habilidades existentes

---

## Features por Fase

### Fase 1 — MVP (✅ Implementado)

**Objetivo:** Sistema funcional mínimo para um jogador gerir o seu personagem.

| Feature | Status | Prioridade | Notas |
|---------|--------|------------|-------|
| Autenticação (username, sem password) | ✅ | Crítica | Login simples, bypass para dev local |
| Perfis de teste (per-user localStorage) | ✅ | Crítica | 7 perfis pré-configurados, dados por username |
| Ficha de personagem (atributos + stats) | ✅ | Crítica | Edição em tempo real, XP, level-up |
| Árvore de habilidades (estrutura visual) | ✅ | Crítica | Dados reais carregados via JSON |
| Loja (layout + mock inicial) | ✅ | Alta | Evoluiu para loja funcional |
| Hub de Jogadores | ✅ | Alta | Dados reais por utilizador |
| Equipamento com stats | ✅ | Alta | Arma/Armadura/Acessório, bónus defesa/esquiva |
| Controlos SP/CP | ✅ | Alta | Botões +/-1/5 para Espírito e Chi |
| Inventário integrado | ✅ | Alta | Página de itens com inventário pessoal |
| Pesquisa de habilidades | ✅ | Média | Filtro por nome/descrição |
| Import/Export JSON | ✅ | Média | Exportar e importar personagem completo |
| Auto-save (localStorage) | ✅ | Média | Debounce 2s, fallback localStorage |
| Estrutura de pastas reorganizada | ✅ | Baixa | Base preparada para evolução do portal |

#### Perfis de Teste (Dev Local)

Usernames disponíveis no login — cada um carrega um personagem pré-configurado com dados diferentes:

| Username | Elemento | Role | Nível | Ouro | Notas |
|----------|----------|------|-------|------|-------|
| `zuko` | 🔥 Fogo | Player | 12 | 450 | Subclasse: Raio Azul |
| `katara` | 🌊 Água | Player | 14 | 320 | Subclasse: Dobra de Sangue |
| `toph` | 🪨 Terra | Player | 15 | 600 | Subclasse: Dobra de Metal |
| `aang` | 🌀 Ar | Player | 18 | 150 | Subclasse: Avatar |
| `sokka` | ⚔️ Sem Dobra | Player | 10 | 800 | Subclasse: Estrategista |
| `gm` | 🔥 Fogo | GM | 30 | 50000 | Vê ferramentas GM no Hub |
| `admin` | 🔥 Fogo | Admin | 40 | 99999 | Acesso total, todos os atributos a 20 |

**Notas:**
- Dados guardados por username no localStorage (trocar de perfil não perde dados)
- Qualquer outro username cria um personagem vazio (nível 1, 0 ouro)
- Ferramentas GM (dar ouro/XP) só visíveis para `gm` e `admin`
- Badge de role aparece na ficha do personagem

### Fase 2 — Sistema de Economia e Dados (✅ Implementado)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Atributo de ouro no personagem | ✅ | Alta |
| Inventário com quantidades | ✅ | Alta |
| Importar JSON (habilidades, itens, ataques) | ✅ | Alta |
| Exportar JSON (personagem) | ✅ | Alta |
| Loja funcional (compra com ouro) | ✅ | Alta |
| Raridade de itens (visual) | ✅ | Média |
| Armaduras com bónus/penalidade | ✅ | Alta |
| Toast/Modal system (substituir alerts nativos) | ✅ | Média |
| GM tools (dar ouro/XP) | ✅ | Alta |

### Fase 3 — Ferramentas de Grupo (✅ Implementado)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Hub de Jogadores funcional (dados reais) | ✅ | Alta |
| Visão expandida do GM | ✅ | Alta |
| Recompensas de ouro em grupo | ✅ | Média |
| Entrega individual de loot | ✅ | Média |
| Troca de itens entre jogadores | ✅ | Média |
| Notificações de troca | ✅ | Baixa |

### Fase 4 — ADMIN e Gestão (✅ Implementado)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Role ADMIN com permissões completas | ✅ | Alta |
| Gestão de utilizadores | ✅ | Alta |
| Backup/restore da base de dados | ✅ | Média |
| Logs de sistema | ✅ | Baixa |

---

## Diagramas

- **Diagrama Não-Técnico Principal:** `DIAGRAMAS-NÃO-TÉCNICOS.md`
- **Diagrama Técnico Principal:** `DIAGRAMAS-TÉCNICOS.md`

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-05-31 | Adicionada Fase 6 (Features Avançadas) completa; backlog reduzido a companheiros + Supabase |
| 2026-05-31 | Adicionada Fase 5 (Testes e Melhorias) com todas as correções documentadas |
| 2026-05-31 | Documento atualizado para refletir Fases 1-4 como implementadas; legenda simplificada; backlog consolidado |
| 2026-04-19 | Documento inicial criado com base em `New Features.txt` |

---

## ✅ Fase 5 — Testes e Melhorias

**Objetivo:** Corrigir problemas de integração encontrados após implementação rápida das Fases 2-4 com sub-agentes em paralelo.

### Correções Implementadas
- ✅ **Export consolidation** — `TRADE_UPDATED_EVENT` exportado corretamente do barrel `trade/index.js`
- ✅ **Event listener cleanup** — Método `destroy()` no HubPage remove listeners ao re-inicializar
- ✅ **Refresh debounce** — Debounce de 50ms no `refresh()` evita renders duplicados
- ✅ **Memory leak prevention** — GroupRewards/LootDelivery reutilizam instâncias em vez de recriar
- ✅ **Hub cleanup on re-login** — `app.js` chama `destroy()` antes de recriar HubPage
- ✅ **Stale notice removed** — Removida a notice "Dados de exemplo" (hub usa dados reais desde Fase 3)

---

## ✅ Fase 6 — Features Avançadas

**Objetivo:** Implementar features do backlog para economia avançada, progressão e ferramentas de GM.

### Economia e Moedas
- ✅ **Moedas por nação** — Moeda secundária por elemento (Fogo, Água, Terra, Ar, Universal). Ouro continua universal. Loja aceita pagamento em moeda nacional. GM distribui via GroupRewards.

### Habilidades e Progressão
- ✅ **Subclasses desbloqueáveis** — 3 subclasses por elemento com requisitos de nível e atributos. Bónus permanente aos stats. UI no character sheet com picker.
- ✅ **Limites de habilidades** — Barra visual de slots usados/total na skill tree. Indicador de "slots cheios" nos cards bloqueados.
- ✅ **Pergaminhos** — Item consumível que adiciona +slots a uma skill ou a marca como "Dominada". Compra na loja, uso no inventário com seleção de skill alvo.
- ✅ **Sub-skill slots UI** — Interface com checkboxes para ativar/desativar sub-habilidades dentro de skills desbloqueadas. Validação de custo e limites.

### Inventário e Itens
- ✅ **Página dedicada de inventário** — Grid visual com equipamento separado, filtros por tipo/raridade, pesquisa, painel de detalhes, equip/unequip.
- ✅ **Raridade mecânica** — Raridade afeta stats reais: multiplicador de dano/defesa + bónus flat. Visualização do boost efetivo no inventário.

### Ferramentas GM
- ✅ **Transferências forçadas (Gifts)** — GM pode transferir ouro, moedas nacionais ou itens entre jogadores sem aceitação. Origem "Nenhum" para criação direta.

---

## 🔮 Backlog (Futuro)

### Companheiros
- Página individual com stats próprios
- Progressão de nível
- Slots de armadura

### Integração Backend
- Supabase (PostgreSQL + Auth)
- Migração de localStorage para BD
- Multi-dispositivo
