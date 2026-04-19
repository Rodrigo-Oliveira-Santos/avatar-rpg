# Avatar RPG — Documento de Features

**Última atualização:** 2026-04-19  
**Status:** Em desenvolvimento ativo

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Páginas do Sistema](#páginas-do-sistema)
3. [Mecânicas Principais](#mecânicas-principais)
4. [Features por Fase](#features-por-fase)
5. [Diagramas](#diagramas)

---

## Visão Geral

Avatar RPG é um sistema de gestão de personagens web para um grupo de RPG inspirado em Avatar: The Last Airbender. O sistema suporta múltiplos jogadores, um GM (Game Master) com ferramentas de gestão, uma role ADMIN com acesso total, e um sistema de economia baseado em moedas por nação.

**Princípios de design:**
- Auto-save é crítico (debounce de 2s)
- Importação de conteúdo via JSON deve ser plug-and-play
- Design iterativo sobre arquitetura perfeita
- PT-BR para texto visível ao utilizador

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

**Funcionalidades:**
- Atributos editáveis (FOR, AGI, CHI, PER, RES, ESP)
- Distribuição de pontos (3 pontos por nível, máx nível 40)
- Visualização de stats derivados (Vida, Chi Max, Espírito Max, Defesa, Esquiva)
- Equipamento de armaduras (slot único)
- Árvore de habilidades por elemento
- Inventário pessoal
- Companheiro (link para página individual)

**Stats derivados (fórmulas atuais):**
| Stat | Fórmula |
|------|---------|
| Vida | 10 + (nível × 8) + (FOR × 3) |
| Chi Max | 6 + (nível × 5) + (CHI × 4) |
| Espírito Max | 8 + (nível × 6) + (ESP × 3) |
| Defesa | RES × 2 + nível + bónus_armadura |
| Esquiva | 10 + ((AGI × 2) + PER) × 0,2 - penalidade_armadura |

**Estado:** ✅ Em desenvolvimento

---

### 2. Página de Árvore de Habilidades

**Público:** Jogador

**Funcionalidades:**
- Habilidades organizadas por elemento (Fogo, Água, Terra, Ar, Non-Bending)
- Habilidades organizadas por categoria (Espiritualidade, Agilidade, Combate Preciso, Combate Bruto)
- Tiers de 1-4 (Iniciante → Lendário)
- Requisitos visíveis (atributos, nível, habilidades prévias)
- Sistema de slots de sub-habilidades (2 base + 1 a cada 3 níveis)
- Pergaminhos para melhorar habilidades (feature futura)
- Limites de desbloqueio por categoria/nível (feature futura)

**Regras:**
- Personagem só pode selecionar habilidades do seu elemento
- Subclasses escondidas até cumprir requisitos (nível + atributos + habilidade prévia)

**Estado:** ✅ Em desenvolvimento

---

### 3. Página de Perfil Simplificado (Hub de Jogadores)

**Público:** Todos os jogadores (visão simplificada), GM (visão expandida)

**Funcionalidades (visão simplificada):**
- Nome do jogador
- Vida atual / Vida máxima
- Buffs/Debuffs ativos
- Companheiro (nome + tipo de animal)
- Elemento do personagem

**Funcionalidades (visão GM expandida):**
- Inventário completo do jogador
- Stats detalhados (todos os atributos)
- Histórico de loot recebido
- Opção de abrir ficha completa em overlay/modal

**Estado:** 🔜 A implementar

---

### 4. Página de Gestão de Grupo (GM Only)

**Público:** GM

**Funcionalidades:**
- Lista de todos os jogadores ativos
- Recompensas de ouro em grupo (valor total dividido igualmente)
- Entrega individual de itens/ouro a jogadores específicos
- Gestão da loja (selecionar itens disponíveis)
- Definição de filtros de nação para moedas na loja

**Fluxo de recompensa em grupo:**
```
GM insere valor total → Sistema divide pelo nº de jogadores → Cada jogador recebe sua parte
```

**Estado:** 🔜 A implementar

---

### 5. Página de Loja

**Público:** Jogador (compra), GM (gestão)

**Funcionalidades (visão Jogador):**
- Search bar para busca de itens
- Filtros por categoria (sem filtro = mostra todos)
- Exibição de itens selecionados pelo GM
- Preços visíveis
- Indicador de raridade do item (Comum/Raro/Épico/Lendário)
- Filtro de nação da moeda (apenas itens compráveis com moedas do jogador)

**Funcionalidades (visão GM):**
- Selecionar/deselecionar itens para exposição na loja
- Alterar preços dos itens
- Definir nação de moedas aceites
- Adicionar/editar detalhes dos itens

**Estado:** 🔜 A implementar

---

### 6. Página de Inventário

**Público:** Jogador

**Funcionalidades:**
- Lista de itens possuídos (com quantidades)
- Ouro atual (detalhado por tipo e nação)
- Equipar armaduras (slot único)
- Sistema de troca com outros jogadores
- Notificações de propostas de troca pendentes

**Estado:** 🔜 A implementar

---

### 7. Página de Companheiros

**Público:** Jogador

**Funcionalidades:**
- Stats básicos (Vida, Ataque, Defesa)
- Tipo de animal
- Link para página do personagem principal
- (Futuro) Slots de armadura para companheiro
- (Futuro) Progressão de nível do companheiro

**Estado:** 📦 Planeado (em discussão)

---

### 8. Página de Importação/Exportação JSON

**Público:** GM (importação), ADMIN (importação/exportação completa), Jogador (exportação própria)

**Funcionalidades (GM):**
- Carregar ficheiros JSON de habilidades
- Carregar ficheiros JSON de itens
- Carregar ficheiros JSON de ataques
- Validação de schema
- Preview dos dados antes de importar para a base de dados

**Funcionalidades (ADMIN):**
- Tudo do GM
- Exportar base de dados completa (backup JSON)
- Exportar todas as habilidades/itens para JSON
- Importar dados em bulk
- Limpar dados importados

**Funcionalidades (Jogador):**
- Exportar personagem completo para JSON (inclui atributos, habilidades, inventário, companheiro)
- Ficheiro pronto para partilha ou backup pessoal

**Estado:** 🔜 A implementar

---

## Mecânicas Principais

### Sistema de Economia

**Moedas:**
- Tipo base: Ouro
- Futuro: 3 tipos adicionais de moedas (maior e menor valor)
- Futuro: Distinção por nação (Fogo, Água, Terra, Ar)

**Regra de nação:** Moedas apenas podem ser gastas na nação correspondente (ex: moedas de Ouro da Água apenas em lojas da Água). O GM define quais moedas são aceites em cada loja.

**Transações entre jogadores:**
- Troca de ouro/loot assíncrona com notificação
- Jogador recebe notificação de proposta de troca/presente
- Pode aceitar ou recusar
- (Futuro) Restrições em combate/imobilizado

---

### Sistema de Raridade de Itens

**Tiers de raridade:**
- Comum
- Raro
- Épico
- Lendário

**Implementação:** Tag na descrição do item. Raridade não tem implicações mecânicas diretas — o balanceamento é feito pelo GM através de atributos e preço.

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

### Fase 1 — MVP (Em desenvolvimento)

| Feature | Status | Prioridade |
|---------|--------|------------|
| Ficha de personagem | ✅ | Crítica |
| Árvore de habilidades | ✅ | Crítica |
| Auto-save (2s debounce) | ✅ | Crítica |
| Exportar JSON | ✅ | Alta |
| Importar JSON | 🔜 | Alta |
| Elementos fixos (Fogo, Água, Terra, Ar, Non-Bending) | ✅ | Crítica |

### Fase 2 — Sistema de Economia e Inventário

| Feature | Status | Prioridade |
|---------|--------|------------|
| Atributo de ouro no personagem | 🔜 | Alta |
| Inventário com quantidades | 🔜 | Alta |
| Página de Loja (visão jogador + GM) | 🔜 | Alta |
| Search bar + filtros na loja | 🔜 | Média |
| Sistema de raridade de itens | 🔜 | Média |
| Armaduras com bónus/penalidade | 🔜 | Alta |

### Fase 3 — Ferramentas de Grupo

| Feature | Status | Prioridade |
|---------|--------|------------|
| Página de perfis simplificados | 🔜 | Alta |
| Visão expandida do GM | 🔜 | Alta |
| Recompensas de ouro em grupo | 🔜 | Média |
| Entrega individual de loot | 🔜 | Média |
| Troca de itens entre jogadores | 🔜 | Média |
| Notificações de troca | 🔜 | Baixa |

### Fase 4 — Sistema de Moedas por Nação

| Feature | Status | Prioridade |
|---------|--------|------------|
| Múltiplos tipos de moedas | 📦 | Baixa |
| Distinção de nação das moedas | 📦 | Baixa |
| Filtro de nação na loja | 📦 | Baixa |

### Fase 5 — Subclasses e Progressão Avançada

| Feature | Status | Prioridade |
|---------|--------|------------|
| Sistema de subclasses | 📦 | Média |
| Requisitos de nível/atributos | 📦 | Média |
| Campo escondido até desbloquear | 📦 | Baixa |

### Fase 6 — Sistema Avançado de Habilidades

| Feature | Status | Prioridade |
|---------|--------|------------|
| Limites de desbloqueio por categoria | 📦 | Baixa |
| Pergaminhos para melhorar habilidades | 📦 | Baixa |
| Separação maior na skill tree | 🔜 | Média |

### Fase 7 — Companheiros

| Feature | Status | Prioridade |
|---------|--------|------------|
| Página de companheiros | 📦 | Baixa |
| Stats básicos de companheiro | 📦 | Baixa |
| Link para personagem principal | 📦 | Baixa |
| (Futuro) Slots de armadura | 📦 | Muito Baixa |
| (Futuro) Progressão de nível | 📦 | Muito Baixa |

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
