# Avatar RPG — Documento de Features

**Última atualização:** 2026-04-20  
**Status:** Em desenvolvimento ativo

**Legenda de Fases:**
- ✅ Implementado
- 🚧 Em desenvolvimento
- 📋 Fase 2 (Próxima prioridade)
- 📦 Fase 3+ (Backlog)
- 🔮 Futuro (longo prazo)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Páginas do Sistema](#páginas-do-sistema)
3. [Mecânicas Principais](#mecânicas-principais)
4. [Features por Fase](#features-por-fase)
5. [Diagramas](#diagramas)

---

## Visão Geral

Avatar RPG é um sistema de gestão de personagens web para um grupo de RPG inspirado em Avatar: The Last Airbender. O sistema suporta múltiplos jogadores, um GM (Game Master) com ferramentas de gestão, uma role ADMIN com acesso total.

**Princípios de design:**
- Design iterativo sobre arquitetura perfeita
- Conteúdo importado via JSON (Fase 2)
- PT-PT para texto visível ao utilizador
- Foco no MVP primeiro: autenticação, ficha, skill tree visual

---

## Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| **JOGADOR** | Jogador normal | Ver/editar ficha própria, ver árvore de habilidades, ver inventário próprio, comprar na loja, trocar com outros jogadores, exportar personagem para JSON |
| **GM** | Game Master | Tudo do Jogador + ver TODAS as fichas (visão expandida), dar ouro/recompensas, gerir loja, entregar loot individual, importar JSON (habilidades, itens) |
| **ADMIN** | Administrador (1-3 contas) | TUDO do GM + gerir utilizadores (criar/eliminar), promover/despromover GMs, limpar dados, backups, acesso a logs completos, exportar base de dados completa |

**Nota:** A role ADMIN é limitada a 2-3 contas. Apenas ADMIN pode criar novas contas GM.

---

## Páginas do Sistema

### 1. Página de Ficha de Personagem (Principal)

**Público:** Jogador (edição completa), GM (visualização)

**Funcionalidades (Fase 1):**
- Atributos editáveis (FOR, AGI, CHI, PER, RES, ESP)
- Distribuição de pontos (3 pontos por nível, máx nível 40)
- Visualização de stats derivados (Vida, Chi Max, Espírito Max, Defesa, Esquiva)
- Equipamento de armaduras (slot único) — 📋 Fase 2
- Secção de inventário integrada — 📋 Fase 2
- Companheiro (link para página individual) — 🔮 Futuro

**Stats derivados (fórmulas atuais):**
| Stat | Fórmula |
|------|---------|
| Vida | 10 + (nível × 8) + (FOR × 3) |
| Chi Max | 6 + (nível × 5) + (CHI × 4) |
| Espírito Max | 8 + (nível × 6) + (ESP × 3) |
| Defesa | RES × 2 + nível + bónus_armadura |
| Esquiva | 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura |

**Estado:** 🚧 Em desenvolvimento (atributos + stats)

---

### 2. Página de Árvore de Habilidades

**Público:** Jogador

**Funcionalidades (Fase 1):**
- Estrutura visual organizada por categoria (Espiritualidade, Agilidade, Combate Preciso, Combate Bruto)
- Tiers de 1-4 (Iniciante → Lendário)
- Requisitos visíveis (atributos, nível, habilidades prévias)
- Dados de exemplo (mock) — elementos completos via JSON na Fase 2

**Funcionalidades (📋 Fase 2):**
- Habilidades carregadas via JSON (todos os 5 elementos)
- Sistema de slots de sub-habilidades (2 base + 1 a cada 3 níveis)

**Funcionalidades (🔮 Futuro):**
- Pergaminhos para melhorar habilidades
- Limites de desbloqueio por categoria/nível

**Regras:**
- Personagem só pode selecionar habilidades do seu elemento
- Subclasses escondidas até cumprir requisitos (nível + atributos + habilidade prévia)

**Estado:** 🚧 Em desenvolvimento (estrutura visual com mock)

---

### 3. Página de Perfil Simplificado (Hub de Jogadores)

**Público:** Todos os jogadores (visão simplificada), GM (visão expandida)

**Funcionalidades (Fase 1 — Mock):**
- Layout da página implementado
- Dados de exemplo (3-5 personagens fictícios)
- Cards com: nome, nível, elemento, vida atual/máx
- **NOTA:** Sem dados reais nesta fase — apenas visual para teste

**Funcionalidades (📋 Fase 3 — Dados Reais):**

| Visão | Funcionalidades |
|-------|-----------------|
| **Jogador (simplificada)** | Nome, Vida atual/máx, Buffs/Debuffs ativos, Elemento |
| **GM (expandida)** | Inventário completo, Stats detalhados, Histórico de loot, Link para ficha completa |

**Nota de Implementação:** Hub de Jogadores e Gestão de Grupo são a mesma página. GM vê secção adicional de gestão (ver secção 4).

**Estado:** 🚧 Mock em desenvolvimento

---

### 4. Página de Gestão de Grupo (GM Only)

**Público:** GM

**Nota:** Esta página é uma extensão do Hub de Jogadores (Secção 3). GM vê uma secção adicional com ferramentas de gestão.

**Funcionalidades (📋 Fase 3):**
- Lista de todos os jogadores ativos (dados reais da BD)
- Recompensas de ouro em grupo (valor total dividido igualmente)
- Entrega individual de itens/ouro a jogadores específicos
- Gestão da loja (selecionar itens disponíveis) — 📋 Fase 2

**Fluxo de recompensa em grupo:**
```
GM insere valor total → Sistema divide pelo nº de jogadores → Cada jogador recebe sua parte
```

**Estado:** 📦 Fase 3 (aguarda Hub funcional)

---

### 5. Página de Loja

**Público:** Jogador (compra), GM (gestão)

**Funcionalidades (Fase 1 — Mock):**
- Layout da loja implementado
- Search bar funcional (sobre dados mock)
- Filtros básicos de categoria
- Dados de exemplo (hardcoded)

**Funcionalidades (📋 Fase 2 — Funcional):**

| Visão | Funcionalidades |
|-------|-----------------|
| **Jogador** | Search bar, filtros por categoria, itens da BD, preços em Ouro, raridade visual |
| **GM** | Selecionar itens para loja, alterar preços |

**Funcionalidades (🔮 Futuro):**
- Raridade com implicações mecânicas (não apenas visual)
- Filtro de nação da moeda
- Moedas por nação (Fogo, Água, Terra, Ar)

**Estado:** 🚧 Mock em desenvolvimento

---

### 6. Página de Inventário

**Público:** Jogador

**Nota de Implementação:** O inventário está integrado na Ficha de Personagem (Secção 1), não é uma página separada.

**Funcionalidades (📋 Fase 2):**
- Lista de itens possuídos (com quantidades)
- Ouro atual (apenas moeda de Ouro nesta fase)
- Equipar armaduras (slot único)
- Sistema de troca com outros jogadores

**Funcionalidades (🔮 Futuro — Página Dedicada):**
- Página própria de inventário com mais descrições e funções
- Organização por categorias
- Filtros e busca avançada
- Histórico completo de aquisições

**Estado:** 📦 Fase 2

---

### 7. Página de Companheiros

**Público:** Jogador

**Funcionalidades (🔮 Futuro):**
- Stats básicos (Vida, Ataque, Defesa)
- Tipo de animal
- Link para página do personagem principal
- Slots de armadura para companheiro
- Progressão de nível do companheiro

**Estado:** 🔮 Planeado (longo prazo)

---

### 8. Página de Importação/Exportação JSON

**Público:** GM (importação), ADMIN (importação/exportação completa), Jogador (exportação própria)

**Funcionalidades (📋 Fase 2):**

| Role | Funcionalidades |
|------|-----------------|
| **GM** | Carregar JSON de habilidades, itens, ataques; Validação de schema; Preview antes de importar |
| **Jogador** | Exportar personagem completo (atributos, habilidades, inventário) |

**Funcionalidades (📋 Fase 4 — ADMIN):**
- Exportar base de dados completa (backup JSON)
- Exportar todas as habilidades/itens para JSON
- Importar dados em bulk
- Limpar dados importados

**Estado:** 📦 Fase 2 (GM + Jogador), Fase 4 (ADMIN)

---

## Mecânicas Principais

### Sistema de Economia

**Fase 2 (📋):**
- Tipo base: Ouro (única moeda)
- Sistema de inventário com quantidades
- Armaduras com bónus de defesa e penalidade de esquiva

**Futuro (🔮):**
- 3 tipos adicionais de moedas (Prata, Bronze, Cobre)
- Distinção por nação (Fogo, Água, Terra, Ar)
- Regra de nação: Moedas apenas podem ser gastas na nação correspondente
- O GM define quais moedas são aceites em cada loja

**Transações entre jogadores (📋 Fase 3):**
- Troca de ouro/loot assíncrona com notificação
- Jogador recebe notificação de proposta de troca/presente
- Pode aceitar ou recusar

**Features Avançadas (🔮 Futuro):**
- Restrições em combate/imobilizado
- Sistema de "gifts" / trocas forçadas (GM)

---

### Sistema de Raridade de Itens

**Fase 2 (📋):**
- Tiers: Comum, Raro, Épico, Lendário
- Tag visual na descrição do item
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

**Regras:**
- Campo escondido até cumprir requisitos
- Subclasses associadas a um dos 5 elementos
- Sem subclasses transversais

---

### Sistema de Habilidades

**Requisitos de desbloqueio:**
- Atributos mínimos
- Nível mínimo
- Habilidades prévias desbloqueadas

**Limites:**
- Limite de habilidades por categoria
- Limite de habilidades por tier/nível
- (Em discussão)

**Pergaminhos:**
- Originalmente: davam slots adicionais
- Em revisão: usados para melhorar habilidades existentes

---

## Features por Fase

### Fase 1 — MVP (🚧 Em Desenvolvimento)

**Objetivo:** Sistema funcional mínimo para um jogador gerir o seu personagem.

| Feature | Status | Prioridade | Notas |
|---------|--------|------------|-------|
| Autenticação (username, sem password) | 🚧 | Crítica | Login simples |
| Ficha de personagem (atributos + stats) | 🚧 | Crítica | Edição em tempo real |
| Árvore de habilidades (estrutura visual) | 🚧 | Crítica | Dados mock |
| Loja (layout + mock) | 🚧 | Alta | Dados hardcoded |
| Hub de Jogadores (mock) | 🚧 | Alta | Dados de exemplo |
| Estrutura de pastas reorganizada | 📋 | Alta | Separar avatar-rpg/ |

**Não incluído na Fase 1:**
- ❌ Auto-save (debounce 2s) — Backlog
- ❌ Importar/Exportar JSON — Fase 2
- ❌ Elementos completos — Fase 2 (via JSON)

### Fase 2 — Sistema de Economia e Dados (📋 Próxima Prioridade)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Atributo de ouro no personagem | 📦 | Alta |
| Inventário com quantidades | 📦 | Alta |
| Importar JSON (habilidades, itens, ataques) | 📦 | Alta |
| Exportar JSON (personagem) | 📦 | Alta |
| Loja funcional (dados da BD) | 📦 | Alta |
| Raridade de itens (visual) | 📦 | Média |
| Armaduras com bónus/penalidade | 📦 | Alta |

### Fase 3 — Ferramentas de Grupo (📦 Backlog)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Hub de Jogadores funcional (dados reais) | 📦 | Alta |
| Visão expandida do GM | 📦 | Alta |
| Recompensas de ouro em grupo | 📦 | Média |
| Entrega individual de loot | 📦 | Média |
| Troca de itens entre jogadores | 📦 | Média |
| Notificações de troca | 📦 | Baixa |

### Fase 4 — ADMIN e Gestão (📦 Longo Prazo)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Role ADMIN com permissões completas | 📦 | Alta |
| Gestão de utilizadores | 📦 | Alta |
| Backup/restore da base de dados | 📦 | Média |
| Logs de sistema | 📦 | Baixa |

### Futuro (🔮 Backlog de Longo Prazo)

| Sistema | Features | Prioridade |
|---------|----------|------------|
| **Moedas Avançadas** | 3 tipos adicionais, distinção por nação | Baixa |
| **Raridade Mecânica** | Bónus de stats, multiplicadores de preço | Baixa |
| **Subclasses** | Campo escondido, requisitos de desbloqueio | Média |
| **Habilidades Avançadas** | Limites por categoria, pergaminhos, slots extra | Baixa |
| **Companheiros** | Stats próprios, progressão, armadura | Baixa |
| **Gifts/Trocas Forçadas** | Entrega escondida de itens | Baixa |
| **Página de Inventário Dedicada** | Mais funções e descrições | Baixa |

---

## Legenda de Status

| Ícone | Status |
|-------|--------|
| ✅ | Implementado |
| 🔜 | Em desenvolvimento / A implementar |
| 📦 | Planeado / Em discussão |

---

## Diagramas Referenciados

- **Diagrama Não-Técnico Principal:** `DIAGRAMAS-NÃO-TÉCNICOS.md`
- **Diagrama Técnico Principal:** `DIAGRAMAS-TÉCNICOS.md`

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-04-19 | Documento inicial criado com base em `New Features.txt` |
