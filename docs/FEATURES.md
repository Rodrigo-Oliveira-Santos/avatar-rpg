# Avatar RPG — Documento de Features

**Última atualização:** 2026-06-30  
**Status:** Documento de referência

> **Nota multi-game:** Este documento descreve apenas a app Avatar.
> Para D&D 5e, Minecraft Builds e arquitetura cross-app, ver:
> [`DND-APP.md`](./DND-APP.md) · [`MINECRAFT-APP.md`](./MINECRAFT-APP.md)
> · [`MULTI-GAME-DESIGN.md`](./MULTI-GAME-DESIGN.md)

**Legenda:**
- ✅ Implementado
- 🔮 Futuro (backlog)
- ⚠️ Decisão pendente — ver [`DECISIONS.md`](./DECISIONS.md)

---

## Notas recentes (2026-06-30)

### Combate — vocabulário + chi regen + ticks no fim da vez
- ✅ **Renome de vocabulário**: o que antes se chamava "ronda" passa a ser **`Turno`** (loop completo de todos os combatentes) e o que antes era "turno" passa a ser **`Vez`** (slot individual de cada combatente). Aplicado em todas as strings de UI (`Próxima vez →`, `Fim da minha vez`, `Turno N`); colunas internas (`current_round`, `current_turn_index`) ficam como estão para evitar migração de schema.
- ✅ **Status effects DoT** (sangrando, queimadura, regeneração) tickam agora por defeito **no fim da vez** do alvo — depois das ações. Efeitos que precisam de fazer efeito *antes* da ação (stun / paralisia / medo / congelado) mantêm `tick_when: 'start'`.
- ✅ **Regeneração de chi**: a cada 2 turnos (rondas 3, 5, 7…) todos os combatentes recebem **+20 chi** automaticamente (cap em `cp_max`). Cobre jogadores e monstros — monstros opt-in via novos campos `cp_max` / `cp_current` no editor (em branco = não usa chi). Migração: `20260630000000_monsters_chi.sql`.

### Conteúdo
- ✅ **Item modifiers** — novo campo livre (`modifiers`, string) no schema de items. Aceite pelo `validators.js` e renderizado no painel de detalhe do inventário com aviso `⚠ Cálculos automáticos pendentes no backend.`. GM pode descrever "Armadura pesada: −2 AGI, +5 DEF" enquanto a lógica não está implementada.
- ✅ **Skill chi cost** — `chi_cost` top-level (number ≥ 0) aceite no schema de habilidades. Renderizado como chip azul `Chi: N` no card. Per-attack `attack.chi_cost` continua a funcionar para custos de ação individual.

### UX
- ✅ **Ferramentas GM no Hub** — renomeado de "⚔ Ferramentas GM (simulado)" para "⚔ Ferramentas GM" + botão `▲ Esconder / ▼ Mostrar` com estado persistido em `localStorage` (mesma UX do mapa).

---

## Notas anteriores (2026-06-30) — Multi-game + admin

### GM Control — modais delegados e ações cross-user
- ✅ **`PlayerShopModal`** — botão `🛒 Comprar` em cada card de jogador; o GM faz uma compra em nome do jogador (ouro ou moedas nacionais), debitando da carteira do próprio.
- ✅ **`PlayerInventoryModal`** — botão `🎒 Inventário`; abre o inventário do jogador com equip/unequip/usar (consumíveis decrementam 1). Reusa os helpers `equipItem`/`unequipItem` envolvendo a ficha numa `Character` temporária.
- ✅ **`PlayerSkillsModal`** — botão `🌳 Skills`; monta a `SkillTree` normal num modal e persiste cada mudança via subscribe debounced (400ms).
- ✅ **Nome clicável + 👤** — abrir a ficha read-only (`CharacterModal`) a partir do card do jogador no GM Control (mesma modal usada pelo Hub).
- ✅ **`💰 Recompensas em Grupo` + `🎁 Entregar Loot`** no header — reusa os componentes do Hub, agora com persistência Supabase-first.
- ✅ Botão `🗑 Apagar conta` no painel **Admin** — apaga via `users` cascade no Supabase + limpa trades órfãos (FK por username, sem cascade automático) + localStorage. Regras: não-self, mínimo 1 admin.

### Hub — mapa interativo
- ✅ **Mapa Avatar World** (Godot) embedido como iframe acima da grelha de jogadores (origem: [iYiyo](https://iyiyo.itch.io/avatarlastairbendermap)).
- ✅ Toggle `▲ Esconder / ▼ Mostrar` com estado persistido em `localStorage`.
- ✅ Iframe **cacheado na instância** — `render()` não recarrega o mapa em cada atualização de status/trade.
- ✅ **Headers Cross-Origin Isolation** (`COOP=same-origin` + `COEP=require-corp`) em `public/serve.json` (dev) e `netlify.toml` (prod) para o runtime Godot poder usar `SharedArrayBuffer`. CDN do `supabase-js` movido para **jsdelivr.net** (que envia `CORP: cross-origin`) para não partir quando o COI fica ativo.

### Skill tree — Sem Dobra: lazy + preview
- ✅ Pop-up de escolha de caminho (chiblocker vs weapons) **deixou de aparecer no login**. Aparece apenas na primeira vez que o jogador abre a aba Sem Dobra, e é **dismissable** (botão `👁 Esconder e pré-visualizar`).
- ✅ **Tabs de preview** no topo da árvore: `🥋 Bloqueador de Chi | ⚔ Utilizador de Armas`. Permite alternar entre as duas árvores antes de comprometer-se.
- ✅ Tentar desbloquear uma habilidade em modo preview força o picker (também dismissable). Caminho comprometido fecha o tab oposto.

### Persistência cross-user
- ✅ Novo helper **`api/gm-characters.js`** (`loadPlayerCharacter`, `savePlayerCharacter`, `listPlayerUsernames`, `deletePlayerAccount`) — Supabase-first com fallback localStorage. `GroupRewards`, `LootDelivery`, `PlayerShopModal`, `PlayerInventoryModal`, `PlayerSkillsModal` e `AdminPanel` agora usam este helper em vez de irem direto ao localStorage (antes silenciosamente falhavam quando o seed só vivia em Supabase).

### Bugfixes
- ✅ **Nome do jogador "stale" ao re-login** — a instância `Character` é agora reposta em `teardownSession()` e ganha o nome correto quando uma conta nova sem preset faz login (antes inheritava o nome do utilizador anterior).
- ✅ **`ouro` em `rowToCharacter`** — campo estava omisso, fazia com que GMs vissem 0 ouro ao abrir a ficha doutro jogador.
- ✅ **`openCharacterModal` Supabase-aware** — clicar num card de jogador seedado (Sokka, Aang, …) já não mostra "ficha indisponível".

### Outras melhorias
- ✅ Admin tab passou a ser a **última opção** no header (antes era seguido pelo "Importar").
- ✅ `npm run dev:all` faz agora `db:start && db:reset && dev` (garante seed dos perfis de teste).

---

## Notas anteriores (2026-06-29)

### Sistema de combate por turnos
- ✅ Encontros centralizados em Supabase (`encounters` + `encounter_combatants`) com Realtime: o painel do combate atualiza em todos os browsers sem refresh.
- ✅ Botão `⚔ Iniciar batalha` vive na nova tab **🎛 Controlo** (GM/Admin).
- ✅ Iniciativa por `promptRoll` — default manual, toggle para "rodar no site" sem alterar a regra default.
- ✅ Jogadores na sua vez têm `Fim da minha vez` que avança mesmo a vez (sem precisar do GM confirmar).
- ✅ Indicador `#1, #2, #3…` (ordem) em todos os cards (Hub, monstros, GM Control, EncounterPanel).
- ✅ Status effects ganharam `damage_per_turn`, `tick_when` (`start`/`end`), `default_duration`, `attribute_mod` → engine de ticks corre automaticamente quando o turno avança.

### Página de Controlo do GM
- ✅ Dashboard único: HP/CP/SP +/- com persistência, skills clicáveis com nomes resolvidos, atalhos `⚡ Efeitos`, `💰 Ouro`, `⭐ XP`, `📝 Notas` (GM), `⚰ Cemitério`.

### Persistência
- ✅ Colunas dedicadas em `characters`: `hp_current`, `cp_current`, `sp_current`, `status_effects`, `player_notes`, `gm_notes`. Updates cirúrgicos via API; AutoSave omite-as.
- ✅ Realtime ligado em `characters`, `monsters`, `encounters`, `trades` — alterações propagam-se sem refresh.

### Trades cross-browser
- ✅ Nova tabela `trades` substitui o storage local-only que assumia ambos os jogadores no mesmo browser.
- ✅ Toast no destinatário ao receber proposta + badge na nav (cross-browser via Realtime).
- ✅ Histórico de trocas no perfil do jogador (`TradeHistoryPanel`).
- ✅ GM forced transfers (GiftTransfer) entram no histórico como `status='forced'`.

### Loja
- ✅ Modo **🛠 Gerir / 🛒 Vista do Jogador** (toggle só para GM).
- ✅ CRUD inline de items (preço/nome/raridade/tipo/descrição) + criar novo.
- ✅ **Perfis de Loja** (`shop_profiles`): bundles named que o GM aplica num clique para trocar o catálogo.

### Outras melhorias
- ✅ Botão "Propor Troca" funciona cross-browser (já não exige a ficha do alvo localmente).
- ✅ Notas no perfil: jogador (próprias, visíveis a si) + GM (sobre o jogador, GM-only).
- ✅ `createElement` usa `setAttribute` para `aria-*`/`data-*`/`role` (antes eram expandos ignorados pelos screen readers).
- ✅ Modais ad-hoc deixaram de aparecer invisíveis (default `.modal-overlay { opacity: 1 }`; `confirmDialog/promptDialog` ainda fazem fade-in).
- ✅ Sistema de botões consistente: `.btn` + variantes `.btn-primary`, `.btn-green`, `.btn-danger`, `.btn-icon`.

### Notas do patch anterior (2026-06-26)

- Botão MAX agora é específico por recurso: `HP-MAX`, `SP-MAX`, `CP-MAX` independentes.
- Esquiva limitada a **15** (cap em `utils/constants.js` → `STAT_CAPS.dodge`).
- Tetos máximos de Vida/Espírito/Chi/Defesa configuráveis em `STAT_CAPS` mas com valores por definir.
- Apenas o GM concede XP (botão de XP desaparece para players).
- Moedas nacionais já não dependem do elemento do jogador.
- GM/Admin não têm ficha de personagem (abas `character`/elementos/`items` ocultas).
- Hub do GM mostra todos os jogadores registados, mesmo sem ficha guardada.
- Modo opcional de persistência Supabase local (ver [`DEV-LOCAL.md`](./DEV-LOCAL.md)).

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
- Estrutura visual organizada em 5 categorias: **Espiritualidade**, **Agilidade**, **Combate (N1-N2 partilhado)**, **Combate Preciso (N3+)**, **Combate Bruto (N3+)**
- Tiers de 1 a **5** (N1 → N4 + **Lendário**), mapeados directamente aos ramos canónicos (`sp`, `ag`, `cb`, `pr`, `br`) dos ficheiros em `docs/skill-trees/*.html`
- **Path lock**: a partir do tier 3 o jogador escolhe entre Preciso (`combat_path='precise'`) ou Bruto (`combat_path='brute'`); a árvore esconde/desativa skills do ramo oposto
- **Sem Dobra (`element='none'`)** tem dois sub-paths: `chiblocker` (bloqueador de chi) e `weapons` (utilizador de armas), guardados em `non_bender_path`
- **Sistema de maestria (M0–M3)**: cada skill com `mastery_levels` evolui automaticamente conforme o uso. Thresholds: 15, 50, 150 usos. Cada nível desbloqueia uma fórmula de dano/efeito diferente; o badge no card mostra `M? · uses/next`
- Requisitos visíveis (atributos, nível, habilidades prévias, ramo)
- Habilidades carregadas via JSON com dados reais; ficheiros canónicos em `data/skills/*.json` extraídos automaticamente de `docs/skill-trees/*.html` via `scripts/extract-skill-trees.mjs`
- Importação JSON a alimentar a árvore com conteúdos dos 5 elementos (+ os 2 paths de Sem Dobra)

**Regras:**
- Personagem só pode seleccionar habilidades do seu elemento (e do `non_bender_path` quando aplicável)
- Subclasses escondidas até cumprir requisitos (nível + atributos + habilidade prévia)
- Maestria registada por `character.recordSkillUse(skillId)` e exposta via `character.getMasteryLevel(skillId)`

**Estado:** ✅ Implementado (UI cards), 🔮 vista canvas com árvore visual e linhas de dependência permanece como melhoria futura

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

### 9. Página de Monstros (GM/Admin)

A tab "Monstros" tem **3 colunas**: `Selecionados p/ batalha` (staged), `Biblioteca`, `⚰ Cemitério`. Cada card oferece:
- `Selecionar p/ batalha` / `✓ Selecionado` — marca para a próxima batalha (`is_staged`).
- `Editar` — abre o form completo (atributos, ataques, loot, notas).
- `⚰ Cemitério` — marca como morto (`is_dead`; não apaga; pode ser revivido).
- `✕` — apaga permanentemente.

`⚔ Iniciar batalha` no header abre o `BattleLauncher` que já pré-seleciona os staged.

**Loot table** suporta dois tipos por entrada:
- `kind: 'item'` — referência a uma row da tabela `items`
- `kind: 'custom'` — drop one-off com `name` livre

Quando um monstro está num encontro ativo (não apenas staged), aparece também no Hub com HP/defesa/efeitos.

**Estado:** ✅ Implementado.

---

### 10. Página de Controlo do GM

**Público:** GM, Admin

Dashboard central a partir do qual o GM controla a sessão inteira (objetivo: 1 computador a coordenar tudo):

- **EncounterPanel sticky** no topo — ordem de vezes, turno atual, controlos GM sempre à mão.
- **Grid de cards** com todos os jogadores + monstros relevantes (staged ou em encontro ativo).
  - **Card de jogador:** nome + nível, HP visual + botões `−5/−1/+1/+5/SET`, lista de habilidades ativas como chips clicáveis, atalhos `⚡ Efeitos` (StatusEffectManager), `💰 Ouro`, `⭐ XP`, `📝 Notas` (gm_notes via popup).
  - **Card de monstro:** HP +/-, ataques como chips, botão `⚰ Cemitério`. Quando HP cai a 0 pergunta se quer mandar para o cemitério.

**Notas atuais:**
- HP dos monstros persiste imediatamente (`monsters.hp_current`).
- HP dos jogadores ainda é ephemeral nesta versão (toast; GM avisa o jogador). Futura iteração: coluna `hp_current` em characters com targeted update.
- Ouro/XP escrevem via `saveCharacter` (full row); race com AutoSave do jogador é aceitável neste modo cooperativo.

**Estado:** ✅ Implementado (display + acções base).

---

### 11. Loja — modo Gerir (GM)

A página da Loja agora deteta GM/admin e mostra um **toggle** no topo:
- `🛠 Gerir` (default para GM): tabela editável de todos os itens (Supabase + imported + mock), com inline edit de nome/tipo/raridade/preço/descrição, checkbox `in_shop`, botão `+ Novo Item` (modal), botão `Promover` para copiar itens mock/imported para a BD.
- `🛒 Vista do Jogador`: vista normal (igual ao que os jogadores veem) para testar.

**Estado:** ✅ Implementado. "Perfis de loja" (bundles named) ficam para iteração futura.

---

### 12. Notas no perfil do jogador

Duas listas de notas separadas, cada uma com CRUD individual (cada nota tem `id`, `text`, `created_at`, `updated_at`):

- **Notas do jogador** (`character.player_notes`): vivem na página do perfil, editáveis pelo próprio jogador. Persistidas via AutoSave normal (a coluna foi promovida em migration `20260629190000_notes.sql`).
- **Notas do GM** (`character.gm_notes`): editáveis a partir da página de Controlo do GM, via popup `📝 Notas` em cada player card. Persistem via `updateGmNotes` (targeted column update) para não competir com o AutoSave do jogador.

**Estado:** ✅ Implementado.

---

### 13. HP/CP/SP persistentes (vitals)

As 3 vitais atuais do jogador (HP / Chi / Espírito) vivem em colunas dedicadas na tabela `characters`:
- `hp_current`, `cp_current`, `sp_current` (int, nullable — `null` = recalcula para o máximo no próximo load).
- Escritas **só** via `updateVitals(username, patch)` (targeted column update). Tanto o próprio jogador (via botões da ficha) como o GM (via GMControlPage) escrevem por aqui.
- AutoSave passa `omitVitals: true` para nunca sobrescrever estas colunas com snapshots stale.
- `characters` está adicionada à publication `supabase_realtime`: o cliente subscreve `postgres_changes` em `app.js` e atualiza as barras de combate quando o GM (ou outro browser) muda um valor. Sem refresh.

**Estado:** ✅ Implementado.

---

### 14. Perfis de Loja (bundles)

Para a GM poder trocar o catálogo da loja num clique:
- Nova tabela `shop_profiles` (id, name, description, item_ids uuid[], created_by, timestamps).
- API `api/shopProfiles.js`: `list`, `create`, `update`, `remove`, `apply(profileId)`, `snapshotCurrent(name, description)`.
- Na tab Loja → modo `🛠 Gerir`, nova secção **Perfis de Loja**:
  - Botão `💾 Guardar atual como perfil` → snapshota todos os items com `in_shop=true` num novo perfil.
  - Cada perfil tem chip com nome + contagem + botões `Aplicar` / `✎ Renomear` / `✕ Apagar`.
  - `Aplicar` faz um update em duas etapas: clear `in_shop=false` em todos, depois set `in_shop=true` nos ids do perfil.

**Estado:** ✅ Implementado.

---

### 15. Trocas cross-browser + Histórico

Antes: as trocas viviam só em `localStorage` e os dois jogadores tinham de estar no mesmo browser. Agora:

**Persistência centralizada**:
- Nova tabela `trades` (migração `20260629230000_trades.sql`) com `from_username`, `to_username`, `offer_items/gold`, `request_items/gold`, `status` (`pending/accepted/rejected/cancelled/forced`), `kind` (`trade/forced/loot/reward`), `note`.
- Adicionada à publication `supabase_realtime` → propostas aparecem no destinatário sem refresh, mesmo noutro browser.

**Fluxo:**
1. Propor: `TradeManager.createTrade()` valida apenas o lado do proponente (a sua ficha está disponível); o destinatário valida quando aceita.
2. Aceitar: `acceptTrade()` carrega ambas as fichas via Supabase (`loadCharacter`), faz remove/add nos inventários, ajusta ouro, persiste ambos e flipa o trade para `accepted`. Realtime notifica o outro browser.
3. Toast no destinatário quando entra uma nova proposta (cross-browser via realtime → CustomEvent → Hub `handleTradeUpdate`).
4. Forçar (GM via GiftTransfer): cria uma row `status='forced'` com `kind='loot'`/`reward` para aparecer no histórico do destinatário.

**Histórico no perfil** (`TradeHistoryPanel`):
- Renderiza no perfil do jogador (`#trade-history-host`) abaixo das notas.
- Lista as 25 trocas mais recentes (aceites, recusadas, canceladas, forçadas pelo GM) com badge de estado, contraparte, data e descritivo de cada lado.
- Subscreve `api/trades.subscribe()` → atualiza-se sozinho.

**Fallback offline:** sem Supabase, a API degrada para localStorage e fica a comportar-se como antes (single-tab).

**Estado:** ✅ Implementado.

---

Para a GM poder trocar o catálogo da loja num clique:
- Nova tabela `shop_profiles` (id, name, description, item_ids uuid[], created_by, timestamps).
- API `api/shopProfiles.js`: `list`, `create`, `update`, `remove`, `apply(profileId)`, `snapshotCurrent(name, description)`.
- Na tab Loja → modo `🛠 Gerir`, nova secção **Perfis de Loja**:
  - Botão `💾 Guardar atual como perfil` → snapshota todos os items com `in_shop=true` num novo perfil.
  - Cada perfil tem chip com nome + contagem + botões `Aplicar` / `✎ Renomear` / `✕ Apagar`.
  - `Aplicar` faz um update em duas etapas: clear `in_shop=false` em todos, depois set `in_shop=true` nos ids do perfil.

**Estado:** ✅ Implementado.

---

Duas listas de notas separadas, cada uma com CRUD individual (cada nota tem `id`, `text`, `created_at`, `updated_at`):

- **Notas do jogador** (`character.player_notes`): vivem na página do perfil, editáveis pelo próprio jogador. Persistidas via AutoSave normal (a coluna foi promovida em migration `20260629190000_notes.sql`).
- **Notas do GM** (`character.gm_notes`): editáveis a partir da página de Controlo do GM, via popup `📝 Notas` em cada player card. Persistem via `updateGmNotes` (targeted column update) para não competir com o AutoSave do jogador.

**Estado:** ✅ Implementado.

---

**Público:** GM, Admin

**Funcionalidades implementadas:**

- Catálogo persistente de NPCs/criaturas (tabela `monsters` no Supabase, fallback localStorage)
- Formulário completo: nome, nível, HP atual/máx, defesa, esquiva, 6 atributos, ataques (lista de `{name, damage, range, effect}`), loot table (misto: itens do catálogo + drops one-off), notas
- Vista em duas colunas: **Em jogo** (cards destacados a vermelho) vs **Biblioteca**
- Botão "Colocar em jogo" / "✓ Em jogo" alterna o flag `in_play`
- Quando um monstro está `in_play`, aparece automaticamente no **Hub** como overlay `⚔ Encontro em curso`, visível a todos os jogadores (HP, defesa, esquiva e efeitos de estado)
- Editar/apagar a qualquer momento; alterações sincronizam-se em tempo real via event `monsters:updated`

**Loot table:** suporta dois tipos por entrada:
- `kind: 'item'` — referência a uma row da tabela `items` (drop "real" do catálogo)
- `kind: 'custom'` — drop one-off com `name` livre (ex: "Insígnia da Nação do Fogo")

**Estado:** ✅ Implementado (display + persistence). Mecânica automática de combate (turn order, application de loot ao morrer, dano automático dos status effects) fica para fase posterior.

---

## Mecânicas Principais

### Sistema de Economia

**Implementado:**
- **Ouro** universal (moeda primária)
- **Moedas nacionais** (Fogo, Água, Terra, Ar, Universal) — qualquer jogador pode usar qualquer moeda; o GM distribui via `GroupRewards`
- Sistema de inventário com quantidades + raridade (mecânica)
- Armaduras com bónus de defesa e penalidade de esquiva
- Loja funcional com compras a ouro **e** a moedas nacionais (preço duplo opcional)
- Recompensas de grupo e entrega individual de loot/ouro
- Transações entre jogadores (sistema de trocas cross-browser)
- Notificações de troca em tempo real
- **Transferências forçadas (Gifts)** pelo GM — ouro, moedas, items, sem aceitação

---

### Sistema de Raridade de Itens

**Implementado:**
- Tiers: Comum, Raro, Épico, Lendário
- Badges/indicadores visuais na apresentação do item
- **Mecânica:** multiplicador de dano/defesa + bónus flat — visível no inventário

**Implementação:** Campo `rarity` no JSON do item. Bónus aplicados via `RARITY_BONUSES` em `utils/constants.js`.

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

### Sistema de Combate por Turnos

**O que faz:**
- O GM inicia uma batalha a partir da tab **Monstros** → `⚔ Iniciar batalha` → modal de seleção de combatentes (jogadores + monstros `in_play`).
- Para cada combatente é pedido o valor de **iniciativa** num popup (`promptRoll`): por defeito é manual (regra da casa — *toda* a UI de rolls começa em manual com toggle para auto-rolar nessa prompt).
- Aparece um **`EncounterPanel`** no Hub (visível a todos) com a ordem completa, turno atual, indicador animado no combatente que está a jogar, número de iniciativa flutuante em cada player card e botões:
  - **Jogador** (apenas no seu próprio combatente, na sua vez) → `Fim da minha vez` (marca `has_acted=true`).
  - **GM** → `Próxima vez →` (avança o cursor, aplica ticks, faz wrap de turno e dispara o chi regen a cada 2 turnos) e `Terminar batalha`.

**Ticks dos efeitos de estado:**
Cada efeito do catálogo (`utils/statusEffects.js`) tem:
- `default_duration` — vezes default ao aplicar (`null` = até remoção)
- `tick_when` — `start` ou `end` da vez do alvo (default `'end'` desde 2026-06-30 — DoT tickam *depois* das ações; stun/paralisia continuam em `'start'`)
- `damage_per_turn` — expressão de dados (ex: `1d4`, `2d6+1`; valor negativo `-1d4` cura)
- `attribute_mod` — modificadores de atributo declarativos (GM aplica manualmente)

Quando a vez avança, o engine corre `applyTickFor` em `combat/statusTicks.js`: aplica dano/cura via `promptRoll`, decrementa duração e remove a 0. Para monstros, o HP é atualizado no row; para jogadores aparece um toast (jogadores controlam o seu próprio HP). **Chi regen** (+20 a cada 2 turnos, rondas 3/5/7…) é aplicado em `combat/regen.js` a todos os jogadores e a monstros com `cp_max` definido.

**Realtime:** o `EncounterPanel` subscreve `postgres_changes` em `encounters` + `encounter_combatants` via Supabase Realtime. Sem Supabase, faz polling a cada 3s na localStorage.

**Cooldowns futuros:** `Character.recordSkillUse` grava `skill_last_used[skillId] = { encounter_id, round, turn_index }` para que a próxima fase consiga implementar cooldowns ancorados ao turno em que a habilidade foi castada.

**Estado:** ✅ Implementado (display + lifecycle + ticks). Cooldowns automáticos e ações em combate (ataques que aplicam efeitos) ficam para próxima iteração.

---

**O que faz:**
- Tags visuais aplicadas pelo GM em jogadores ou monstros
- Mostrados como chips coloridas no card (positivo=verde, negativo=vermelho) com ícone + nome + tooltip de descrição
- Persistidos em `character.status_effects` (jogadores) e `monsters.status_effects` (NPCs)
- Cada efeito carrega `default_duration`, `tick_when` (`start|end`), `damage_per_turn` (expressão de dados; valor negativo = cura) e `attribute_mod` declarativo — usados pelo Sistema de Combate por Turnos para ticks automáticos

**Catálogo pré-definido** (`public/js/utils/statusEffects.js`):
- **Negativos:** Sangrando, Atordoado, Cego, Enjoado, Fatigado, Paralisado, Lentidão, Aterrorizado, Queimadura, Congelado, Envenenado
- **Positivos:** Regeneração, Acelerado, Escudo, Concentrado, Inspirado, Invisível, A Voar

**Aplicação:**
1. GM abre o card do jogador no **Hub** → botão `⚡ Efeitos`
2. Modal mostra efeitos atuais (com × para remover), grelha do catálogo (clica para aplicar) e form para criar custom (nome + polaridade)
3. Ao fechar, escreve em Supabase (`saveCharacter`) + localStorage e emite evento `status-effects:updated` para refrescar a UI

**Estado:** ✅ Implementado (apenas etiquetas visuais; tracking de turnos e aplicação automática de dano fica para fase posterior).

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

- **Diagrama Não-Técnico Principal:** `DIAGRAMAS-NAO-TECNICOS.md`
- **Diagrama Técnico Principal:** `DIAGRAMAS-TECNICOS.md`

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-06-30 | Documentação reorganizada para `docs/`; renames com ASCII (sem acentos). GM Control modais delegados, mapa interativo no Hub, COI headers, admin delete account, lazy non-bender path picker, bugfix nome stale ao re-login |
| 2026-06-29 | Sistema de combate por turnos + GM Control + persistência cirúrgica + trades cross-browser + loja modo Gerir + notas duplas + sistema `.btn` |
| 2026-06-26 | Botões MAX separados, dodge cap, GM-only XP, moedas universais, GM/admin sem ficha, hub do GM com unsaved, Supabase opcional |
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
- Schema existe em `supabase/migrations/20260101000000_init.sql` (`companions` table); UI/regras ainda por implementar

### Integração Supabase Auth
- Substituir o login só-por-username pela Supabase Auth real (email/password ou magic link)
- Re-aplicar RLS estrito (a migration `20260628000000_relax_rls_pre_auth.sql` é removida quando isto for feito)
- Multi-dispositivo com sessão sincronizada

### Cooldowns automáticos
- `Character.recordSkillUse` já grava `skill_last_used[id] = { encounter_id, round, turn_index }`. Falta a engine que lê esse estado e bloqueia ativação até X turnos depois.

### Resolução automática de ações em combate
- Ataques que aplicam efeitos selecionando alvos no `EncounterPanel` (em vez de o GM aplicar manualmente)
