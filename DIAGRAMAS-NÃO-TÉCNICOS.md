# Diagramas Não-Técnicos — Avatar RPG

**Objetivo:** Explicar o fluxo das mecânicas e features do jogo de forma visual e compreensível.

**Legenda de Status:**
- ✅ Implementado
- 🚧 Em desenvolvimento
- 📋 Backlog (Fase 2+)
- 🔮 Futuro (longo prazo)

---

## 1. Visão Geral do Sistema de Páginas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AVATAR RPG — HUB DE NAVEGAÇÃO                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌──────────────┬────────────┼────────────┬──────────────┐
          ▼              ▼            ▼            ▼              ▼
   ┌─────────────┐ ┌───────────┐ ┌─────────┐ ┌───────────┐ ┌──────────┐
   │   FICHA     │ │  ÁRVORE   │ │  HUB    │ │  LOJA     │ │INVENTÁRIO│
   │PERSONAGEM   │ │HABILIDADES│ │JOGADORES│ │           │ │          │
   │             │ │           │ │         │ │           │ │          │
   │ - Atributos │ │ - Fogo    │ │ - Lista │ │ - Search  │ │ - Itens  │
   │ - Stats     │ │ - Água    │ │   GM    │ │ - Filtros │ │ - Ouro   │
   │ - Equip.    │ │ - Terra   │ │ - Lista │ │ - Raridade│ │ - Trocas │
   │ - Invent.   │ │ - Ar      │ │   Jog.  │ │ - Preços  │ │          │
   │ - Companh.  │ │ - Non     │ │ - Perfis│ │           │ │          │
   └──────┬──────┘ └───────────┘ └────┬────┘ └───────────┘ └──────────┘
          │                           │
          │                           │
          ▼                           ▼
   ┌─────────────┐           ┌─────────────────┐
   │COMPANHEIRO  │           │GESTÃO DE GRUPO  │
   │(Individual) │           │(GM Only)        │
   │             │           │                 │
   │ - Stats     │           │ - Recompensas   │
   │ - Tipo      │           │ - Loot individual
   │ - Armadura? │           │ - Gestão Loja   │
   └─────────────┘           └─────────────────┘

Legenda:
  ✅ Ficha, Árvore, Loja (mock), Hub (mock) — Fase 1
  📋 Inventário, Gestão de Grupo — Fase 2/3
  🔮 Página própria de Inventário — Futuro
```

---

## 2. Fluxo de Permissões por Tipo de Utilizador

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           TIPOS DE UTILIZADOR                              │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│         JOGADOR                 │      │           GM                    │
│                                 │      │                                 │
│  ✅ Editar ficha própria        │      │  ✅ Tudo do Jogador +           │
│  ✅ Ver árvore de habilidades   │      │  ✅ Ver TODAS as fichas         │
│  ✅ Ver inventário próprio      │      │  ✅ Versão expandida dos perfis │
│  ✅ Comprar na loja             │      │  ✅ Dar ouro (grupo/individual) │
│  ✅ Trocar com outros jogadores │      │  ✅ Dar itens/loot              │
│  ✅ Ver companion próprio       │      │  ✅ Gerir loja (preços, itens)  │
│  ✅ Exportar personagem (JSON)  │      │  ✅ Definir filtros de nação    │
│                                 │      │  ✅ Importar JSON (habilidades, │
│  ❌ Ver fichas completas outros │      │              itens, ataques)    │
│  ❌ Gerir loja                  │      │  ❌ Editar fichas dos jogadores │
│  ❌ Dar recompensas             │      │  ❌ Gerir utilizadores          │
└─────────────────────────────────┘      └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN (1-3 contas)                            │
│                                                                         │
│  ✅ TUDO do GM +                                                        │
│  ✅ Gerir utilizadores (criar, eliminar, editar)                        │
│  ✅ Promover/Despromover GMs                                            │
│  ✅ Backup completo da base de dados (exportar JSON)                    │
│  ✅ Restaurar base de dados (importar JSON)                             │
│  ✅ Limpar dados globais (habilidades, itens)                           │
│  ✅ Acesso a logs completos do sistema                                  │
│  ✅ Exportar todos os personagens para JSON                             │
│                                                                         │
│  NOTA: Apenas ADMIN pode criar novas contas GM                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Fluxo de Recompensa de Ouro (GM)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RECOMPENSA DE OURO — FLUXO GM                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   GM abre    │
│ página de    │
│ Gestão Grupo │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  OPÇÃO A: RECOMPENSA EM GRUPO                                      │  │
│  │                                                                    │  │
│  │  [ Inserir Valor Total: _______ ]  [ Dividir pelo Grupo ]          │  │
│  │                                                                    │  │
│  │  Preview: 1000 ouro ÷ 4 jogadores = 250 ouro cada                  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  OPÇÃO B: ENTREGA INDIVIDUAL                                       │  │
│  │                                                                    │  │
│  │  Selecionar Jogador: [Dropdown ▼]                                  │  │
│  │  Tipo: [ Ouro ▼ ]  [ Item ▼ ]                                      │  │
│  │  Quantidade: [ _______ ]                                           │  │
│  │  [ Enviar ]                                                        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Sistema    │
│ atualiza     │
│ inventário   │
│ do(s)        │
│ jogador(es)  │
└──────────────┘
```

---

## 4. Fluxo de Troca entre Jogadores

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TROCA DE ITENS/OURO ENTRE JOGADORES                      │
└─────────────────────────────────────────────────────────────────────────────┘

Jogador A                         Sistema                        Jogador B
   │                                │                                │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
   │  Seleciona item/ouro           │                                │
   │  "Enviar para..."              │                                │
   │                                │                                │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│                                │
   │  Proposta de troca             │                                │
   │                                │                                │
   │                                │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│
   │                                │     Notificação:               │
   │                                │     "Jogador A quer te enviar  │
   │                                │      50 ouro / Item X"         │
   │                                │                                │
   │                                │  ◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
   │                                │     Jogador B decide:          │
   │                                │     [ Aceitar ] [ Recusar ]    │
   │                                │                                │
   │  ◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
   │  (Se aceite)                   │                                │
   │  Confirmação                   │                                │
   │  "Troca concluída"             │                                │
   │                                │                                │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
   │  Item/Ouro transferido         │      Item/Ouro recebido        │
   ▼                                ▼                                ▼
```

---

## 5. Fluxo de Gestão da Loja (GM)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GESTÃO DA LOJA — FLUXO GM                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  📋 FASE 2: LOJA COM UMA MOEDA (OURO)                                    │
│                                                                          │
│  BANCO GLOBAL DE ITENS (todos os itens disponíveis)                      │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Espadas    │ │  Poções     │ │  Armaduras  │ │  Materiais  │        │
│  │  (ilimit.)  │ │  (ilimit.)  │ │  (ilimit.)  │ │  (ilimit.)  │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────────────────────────────────────┘
                            │
                            │ GM seleciona
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ITENS NA LOJA (visível aos jogadores) — FASE 2                         │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Item              │ Preço (Ouro) │ [Editar]                        │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  Espada de Fogo    │ 150          │ [✏️]                            │ │
│  │  Poção de Cura     │ 50           │ [✏️]                            │ │
│  │  Armadura de Terra │ 300          │ [✏️]                            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [ + Adicionar Item ]                                                    │
│                                                                          │
│  NOTA: Apenas moeda de OURO nesta fase.                                  │
└──────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Jogadores veem
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  LOJA (visão do Jogador) — FASE 2                                       │
│                                                                          │
│  [ Search bar: ______________ ]  [ Filtro Categoria: Todas ▼ ]          │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                        │
│  │Espada Fogo  │ │Poção Cura   │ │Armadura     │                        │
│  │150 Ouro     │ │50 Ouro      │ │300 Ouro     │                        │
│  │[ Comprar ]  │ │[ Comprar ]  │ │[ Comprar ]  │                        │
│  └─────────────┘ └─────────────┘ └─────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  🔮 FUTURO: MOEDAS POR NAÇÃO                                             │
│                                                                          │
│  Após Fase 2 funcionar com OURO apenas:                                 │
│  • 3 tipos adicionais de moedas (Prata, Bronze, Cobre)                   │
│  • Distinção por nação (Fogo, Água, Terra, Ar)                           │
│  • Filtros de nação na loja                                              │
│  • Restrições de compra por nação                                        │
│                                                                          │
│  Ver Secção 10 para diagrama completo do sistema de nações.              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Sistema de Raridade de Itens

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TIERS DE RARIDADE — 📋 FASE 2+                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  📋 FASE 2: RARIDADE VISUAL (SEM IMPLICAÇÕES MECÂNICAS)                 │
│                                                                         │
│  A raridade é apenas uma TAG VISUAL na descrição do item.               │
│  O balanceamento é feito pelo GM através de atributos e preço.          │
│                                                                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐          │
│  │   COMUM      │    RARO      │    ÉPICO     │   LENDÁRIO   │          │
│  │              │              │              │              │          │
│  │  ⚪ Branco   │  🟢 Verde    │  🟣 Roxo     │  🟠 Laranja  │          │
│  │              │              │              │              │          │
│  │  Sem bónus   │  Sem bónus   │  Sem bónus   │  Sem bónus   │          │
│  │  (visual)    │  (visual)    │  (visual)    │  (visual)    │          │
│  └──────────────┴──────────────┴──────────────┴──────────────┘          │
│                                                                         │
│  IMPLEMENTAÇÃO: Campo `rarity` no JSON do item.                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🔮 FUTURO: RARIDADE COM IMPLICAÇÕES MECÂNICAS                          │
│                                                                         │
│  Após Fase 2 estar funcional, pode-se adicionar:                        │
│                                                                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐          │
│  │   COMUM      │    RARO      │    ÉPICO     │   LENDÁRIO   │          │
│  │              │              │              │              │          │
│  │  Stats base  │  Stats +10%  │  Stats +25%  │  Stats +50%  │          │
│  │  Preço base  │  Preço ×1.5  │  Preço ×2.5  │  Preço ×4    │          │
│  │              │              │              │              │          │
│  │  Drop comum  │  Drop médio  │  Drop raro   │  Drop único  │          │
│  └──────────────┴──────────────┴──────────────┴──────────────┘          │
│                                                                         │
│  NOTA: Esta implementação futura requer rebalanceamento                 │
│  cuidadoso para não quebrar a economia do jogo.                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Fluxo de Desbloqueio de Subclasses

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DESBLOQUEIO DE SUBCLASSES — FLUXO                        │
└─────────────────────────────────────────────────────────────────────────────┘

Personagem Nível 1
       │
       ▼
┌─────────────────────────────────┐
│  Campo "Subclase"               │
│  ┌───────────────────────────┐  │
│  │ 🔒 BLOQUEADO             │  │
│  │                           │  │
│  │  Requisitos não atingidos │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
       │
       │ Personagem evolui...
       ▼
┌─────────────────────────────────┐
│  VERIFICAÇÃO DE REQUISITOS:     │
│                                 │
│  □ Nível ≥ 15                   │
│  □ CHI ≥ 10                     │
│  □ PER ≥ 5                      │
│  □ Habilidade "X" desbloqueada  │
└─────────────────────────────────┘
       │
       │ Todos os requisitos ✓
       ▼
┌─────────────────────────────────┐
│  Campo "Subclase"               │
│  ┌───────────────────────────┐  │
│  │ 🔓 DESBLOQUEADO           │  │
│  │                           │  │
│  │  [ Selecionar Subclasse ▼]│  │
│  │                           │  │
│  │  Opções disponíveis:      │  │
│  │  • Mestre do Fogo Azul    │  │
│  │  • Guerreiro Solar        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 8. Sistema de Elementos e Habilidades

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE ELEMENTOS E HABILIDADES                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PERSONAGEM (Elemento: FOGO)                                            │
│                                                                         │
│  Pode acessar APENAS habilidades de FOGO                                │
└─────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ÁRVORE DE HABILIDADES — FOGO                                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  CATEGORIA: COMBATE BRUTO                                           ││
│  │                                                                      ││
│  │  Tier 1 (Iniciante)                                                 ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  ││
│  │  │Soco de Fogo │  │Chute Incend.│  │Muro de Fogo │                  ││
│  │  │[Desbloquear]│  │[Desbloquear]│  │[Desbloquear]│                  ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  ││
│  │                                                                      ││
│  │  Tier 2 (Avançado) ← Requer 1 habilidade Tier 1                     ││
│  │  ┌─────────────┐  ┌─────────────┐                                   ││
│  │  │Lança de Fogo│  │Explosão     │                                   ││
│  │  │[Bloqueado]  │  │[Bloqueado]  │                                   ││
│  │  └─────────────┘  └─────────────┘                                   ││
│  │                                                                      ││
│  │  Tier 3 (Mestre) ← Requer 2 habilidades Tier 2                      ││
│  │  ┌─────────────┐                                                     ││
│  │  │Fogo Azul    │                                                     ││
│  │  │[Bloqueado]  │                                                     ││
│  │  └─────────────┘                                                     ││
│  │                                                                      ││
│  │  Tier 4 (Lendário) ← Requer todas Tier 3                            ││
│  │  ┌─────────────┐                                                     ││
│  │  │Dragão de    │                                                     ││
│  │  │Fogo         │                                                     ││
│  │  │[Bloqueado]  │                                                     ││
│  │  └─────────────┘                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  PERSONAGEM (Elemento: ÁGUA) → Acessa APENAS árvore de ÁGUA             │
│  PERSONAGEM (Elemento: TERRA) → Acessa APENAS árvore de TERRA           │
│  PERSONAGEM (Elemento: AR) → Acessa APENAS árvore de AR                 │
│  PERSONAGEM (Elemento: NON-BENDING) → Árvore especial sem elemento      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Fluxo de Importação JSON (GM)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    IMPORTAÇÃO DE DADOS VIA JSON — FLUXO                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   GM faz     │
│   upload     │
│   ficheiro   │
│   JSON       │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────┐
│  SISTEMA VALIDA JSON            │
│                                 │
│  □ Schema correto?              │
│  □ Campos obrigatórios?         │
│  □ Valores válidos?             │
└──────────────┬──────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│  ✅ VÁLIDO  │ │  ❌ INVÁLIDO│
└──────┬──────┘ └──────┬──────┘
       │               │
       ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│  PREVIEW DOS    │ │  ERRO DETETADO  │
│  DADOS          │ │                 │
│                 │ │  [ Ver Erro ]   │
│  ┌───────────┐  │ │  [ Tentar de    │
│  │Habilidade │  │ │   Novo ]        │
│  │"Soco de   │  │ │                 │
│  │Fogo"      │  │ │                 │
│  │Tier 1     │  │ │                 │
│  └───────────┘  │ │                 │
│                 │ │                 │
│  [ Confirmar ]  │ │                 │
│  [ Cancelar ]   │ │                 │
└────────┬────────┘ └─────────────────┘
         │
         │ Confirmado
         ▼
┌─────────────────┐
│  DADOS ADICIONA-│
│  DOS À BASE DE  │
│  DADOS          │
│                 │
│  ✅ Importação  │
│     concluída!  │
└─────────────────┘
```

---

## 10. Sistema de Moedas por Nação (Futuro)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE MOEDAS POR NAÇÃO (FUTURO)                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  TIPOS DE MOEDAS (exemplo)                                              │
│                                                                         │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐          │
│  │  OURO        │  PRATA       │  BRONZE      │  COBRE       │          │
│  │  (Alto)      │  (Médio)     │  (Baixo)     │  (Mínimo)    │          │
│  │              │              │              │              │          │
│  │  1 Ouro      │  10 Prata    │  100 Bronze  │  1000 Cobre  │          │
│  │      =       │      =       │      =       │      =       │          │
│  │  10 Prata    │  100 Bronze  │  1000 Cobre  │  10000 Cobre │          │
│  └──────────────┴──────────────┴──────────────┴──────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NAÇÃO DA MOEDA                                                         │
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  FOGO 🔥   │  │  ÁGUA 💧   │  │  TERRA 🟤  │  │  AR 💨     │        │
│  │            │  │            │  │            │  │            │        │
│  │ Moedas de  │  │ Moedas de  │  │ Moedas de  │  │ Moedas de  │        │
│  │ Fogo apenas│  │ Água apenas│  │ Terra apenas│  │ Ar apenas  │        │
│  │ em lojas   │  │ em lojas   │  │ em lojas   │  │ em lojas   │        │
│  │ de Fogo    │  │ de Água    │  │ de Terra   │  │ de Ar      │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FLUXO DE COMPRA NA LOJA                                                │
│                                                                         │
│  Jogador (Nação: ÁGUA) entra na loja                                   │
│                     │                                                   │
│                     ▼                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │  FILTRO AUTOMÁTICO: Mostra apenas itens compráveis com moedas    │ │
│  │  de ÁGUA ou moedas UNIVERSAIS                                     │ │
│  │                                                                   │ │
│  │  ✅ Poção de Cura (50 Prata - Todas)         [Comprar]            │ │
│  │  ✅ Pergaminho (100 Bronze - Água)           [Comprar]            │ │
│  │  ❌ Espada de Fogo (150 Ouro - Fogo)         [Indisponível]       │ │
│  │  ❌ Armadura de Terra (300 Ouro - Terra)     [Indisponível]       │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  NOTA: GM define quais moedas são aceites em cada loja                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Equipamento de Armaduras

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE ARMADURAS                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FICHA DE PERSONAGEM — SECÇÃO DE EQUIPAMENTO                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ARMADURA (Slot Único)                                              ││
│  │                                                                     ││
│  │  [ Selecionar Armadura ▼ ]                                          ││
│  │                                                                     ││
│  │  Opções disponíveis:                                                ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │  Armadura Leve de Couro                                       │  ││
│  │  │  Defesa: +5  |  Penalidade Esquiva: -2                       │  ││
│  │  │  Peso: Leve                                                   │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │  Armadura Média de Malha                                      │  ││
│  │  │  Defesa: +12 |  Penalidade Esquiva: -5                       │  ││
│  │  │  Peso: Médio                                                  │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │  ┌───────────────────────────────────────────────────────────────┐  ││
│  │  │  Armadura Pesada de Placas                                    │  ││
│  │  │  Defesa: +20 |  Penalidade Esquiva: -10                      │  ││
│  │  │  Peso: Pesado                                                 │  ││
│  │  └───────────────────────────────────────────────────────────────┘  ││
│  │                                                                     ││
│  │  [ Equipar ]  [ Remover ]                                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  APLICAÇÃO EM TEMPO REAL NOS STATS                                      │
│                                                                         │
│  SEM ARMADURA:                            COM ARMADURA DE PLACAS:       │
│  ┌─────────────────────────────┐          ┌────────────────────────────┐│
│  │  Defesa: 25                 │          │  Defesa: 45 (+20)          ││
│  │  Esquiva: 18                │          │  Esquiva: 8 (-10)          ││
│  │  Vida: 50                   │          │  Vida: 50                  ││
│  │  Chi Max: 30                │          │  Chi Max: 30               ││
│  └─────────────────────────────┘          └────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Sistema de Inventário (Atualizado)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INVENTÁRIO — LOCALIZAÇÃO E FLUXO                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  📍 FASE 1/2: INVENTÁRIO NA FICHA DE PERSONAGEM                         │
│                                                                         │
│  O inventário está INTEGRADO na página da Ficha de Personagem,          │
│  não é uma página separada.                                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  FICHA DE PERSONAGEM                                              │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                         │  │
│  │  │   ATRIBUTOS     │  │    STATS        │                         │  │
│  │  │   FOR  [10]     │  │   Vida: 50/50   │                         │  │
│  │  │   AGI  [8]      │  │   Chi: 30/30    │                         │  │
│  │  │   ...           │  │   Defesa: 25    │                         │  │
│  │  └─────────────────┘  └─────────────────┘                         │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │
│  │  │  INVENTÁRIO (Secção integrada)                              │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │  │
│  │  │  │  Espada     │ │  Poção x3   │ │  Armadura   │            │  │
│  │  │  │  (Equipada) │ │  (Consum.)  │ │  (Slot)     │            │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘            │  │
│  │  │                                                            │  │
│  │  │  Ouro: 500                                                │  │
│  │  │  [ Abrir Trocas ] [ Ver Histórico ]                       │  │
│  │  └─────────────────────────────────────────────────────────────┘  │
│  └───────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🔮 FUTURO: PÁGINA DEDICADA DE INVENTÁRIO                               │
│                                                                         │
│  Quando o sistema crescer, pode fazer sentido criar uma página           │
│  própria para o inventário com:                                         │
│                                                                         │
│  • Gestão avançada de itens (organizar por categorias)                  │
│  • Mais descrições detalhadas de cada item                              │
│  • Funções de gestão (vender, descartar, comparar)                      │
│  • Histórico completo de aquisições                                     │
│  • Filtros e busca avançada                                             │
│                                                                         │
│  JUSTIFICATIVA: Manter inventário na ficha é mais simples               │
│  e direto para o MVP. Página dedicada adiciona complexidade             │
│  desnecessária na Fase 1.                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Sistema de Trocas Avançadas (Futuro)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TROCAS AVANÇÇADAS E GIFTS (FUTURO)                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FEATURE: GIFTS / TROCAS FORÇADAS                                       │
│                                                                         │
│  Cenários de uso:                                                       │
│  • GM entrega item secreto a jogador (missão)                           │
│  • Jogador deixa "presente escondido" para outro                        │
│  • Evento de RPG: roubo, entrega discreta, etc.                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  FLUXO DE GIFT ESCONDIDO                                          │  │
│  │                                                                   │  │
│  │  1. Jogador A seleciona item → "Entregar escondido"               │  │
│  │  2. Escolhe Jogador B                                             │  │
│  │  3. (Opcional) Adiciona mensagem secreta                          │  │
│  │  4. Sistema adiciona ao inventário de B sem notificação pública   │  │
│  │  5. Jogador B descobre ao abrir inventário                        │  │
│  │                                                                   │  │
│  │  ─────────────────────────────────────────────────────────────    │  │
│  │  NOTA: Requer role GM para trocas forçadas verdadeiras            │
│  └───────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  COMPARAÇÃO: TROCA NORMAL vs GIFT                                       │
│                                                                         │
│  TROCA NORMAL:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Jogador A propõe → Jogador B vê notificação → [Aceitar/Recusar] │    │
│  │ → Transação visível para ambos                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  GIFT / TROCA FORÇADA:                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Jogador A envia → Item aparece no inventário de B              │    │
│  │ → Sem notificação (ou notificação discreta)                     │    │
│  │ → Jogador B descobre ao abrir inventário                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  STATUS: 🔮 Backlog (após sistema de trocas básico funcionar)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Índice de Diagramas Técnicos

Os diagramas técnicos estão documentados em: **[DIAGRAMAS-TÉCNICOS.md](./DIAGRAMAS-TÉCNICOS.md)**

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 2026-04-19 | Diagramas não-técnicos iniciais criados |
