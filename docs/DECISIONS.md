# Avatar RPG — Decisões e Pendentes

**Última atualização:** 2026-06-30

Este documento centraliza decisões de design tomadas (ou ainda em aberto) que afectam a implementação. Manter aqui evita-as perderem-se no histórico.

---

## ✅ Decisões aplicadas

### Cross-Origin Isolation via `require-corp` + jsdelivr (não `credentialless` + esm.sh)
- O mapa Avatar embedido no Hub é um build Godot que precisa de `SharedArrayBuffer` → exige Cross-Origin Isolation no parent.
- Avaliámos `Cross-Origin-Embedder-Policy: credentialless` (sem exigir CORP em terceiros) vs `require-corp` (exige CORP em todos os cross-origin loads).
- **Escolhido `require-corp`** porque `credentialless` ainda não tem suporte universal (Safari não suporta de todo na v17).
- Para isso, o loader do `supabase-js` foi movido de `esm.sh` (sem CORP) para `cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm` (envia `cross-origin-resource-policy: cross-origin` em todas as respostas).
- Headers vivem em `public/serve.json` (dev local) e `netlify.toml` (produção).

### Helper único para persistência cross-user (`api/gm-characters.js`)
- Antes: `LootDelivery`, `GroupRewards`, `GiftTransfer` rolavam cada um a sua lógica `localStorage.getItem('avatar_rpg_character_…')`. Quando o utilizador estava em modo Supabase mas o jogador alvo só tinha ficha seedada (sem localStorage), as escritas falhavam silenciosamente.
- Centralizado em `loadPlayerCharacter`/`savePlayerCharacter`/`listPlayerUsernames`/`deletePlayerAccount`. Supabase-first, fallback para localStorage.
- Todos os modais novos (`PlayerShopModal`, `PlayerInventoryModal`, `PlayerSkillsModal`) e o `AdminPanel` usam este helper.

### Apagar contas no painel de Admin com cascade explícito
- Botão `🗑 Apagar` por linha em `AdminPanel`.
- Regras: não permite self-delete; não permite remover o último admin.
- A cascade do Supabase (`users → characters → character_skills/items/trades`) apaga a maior parte das dependências, mas a tabela `trades` usa `from_username/to_username` (text, sem FK) — `deletePlayerAccount` faz um DELETE explícito antes do user delete para evitar trades órfãos.

### Sem Dobra: path picker lazy + preview-aware
- Antes: a escolha de caminho (chiblocker vs weapons) era forçada no login, mesmo que o jogador nunca abrisse a aba Sem Dobra.
- Agora: nada se pergunta no login. Quando o jogador abre a aba pela primeira vez, aparece um picker **dismissable** (botão `👁 Esconder e pré-visualizar`).
- O topo da árvore tem tabs `🥋 Bloqueador de Chi | ⚔ Utilizador de Armas` para alternar entre as duas árvores sem comprometer.
- Tentar desbloquear uma habilidade em modo preview re-abre o picker. Caminho comprometido fecha o tab oposto.

### GM acede à árvore de skills do jogador a partir do GM Control
- Modal `🌳 Skills` por jogador no GM Control. Reusa a `SkillTree` normal montada numa `Character` temporária; mudanças persistem via subscribe debounced (400ms).
- Mesma técnica para `🎒 Inventário` (PlayerInventoryModal) e `🛒 Comprar` (PlayerShopModal — paga com a carteira do jogador alvo).

### Botão MAX é específico de cada recurso
- Antes: `#hp-max` repunha HP, SP e CP de uma vez.
- Agora: `#hp-max`, `#sp-max`, `#cp-max` cada um repõe apenas o seu próprio recurso.

### Esquiva limitada a 15
- Cap fixo aplicado em `calculateAllStats` via `STAT_CAPS.dodge = 15`.

### Tetos de Vida/Espírito/Chi/Defesa
- Estrutura preparada em `utils/constants.js` (`STAT_CAPS`), aplicada em `character/stats.js`.
- **Valores actuais:** `null` (sem cap). **Pendente definir números.**
- Para activar: editar `STAT_CAPS` (`maxHP`, `maxSP`, `maxCP`, `defense`).

### Apenas o GM concede XP
- O botão "Adicionar XP" da ficha do jogador agora só aparece para utilizadores com role `gm`.
- Ferramentas GM no Hub (XP individual + `GroupRewards`) continuam disponíveis.

### Qualquer elemento pode pagar com moedas de qualquer nação
- Removido o filtro `getNativeCurrency().id === item.nationPrice.currency` em `ShopPage.canUseNationPrice`.
- Continua-se a exigir saldo suficiente para a moeda escolhida.

### GM/Admin sem ficha de personagem
- Em `setupNavigation`, as abas `character`, elementos (`fire`/`water`/`earth`/`air`/`none`) e `items` ficam ocultas para roles `gm`/`admin`.
- GM/admin abrem por defeito no `hub`.
- Admin tab é a **última opção** no header.

### Hub do GM lista jogadores sem ficha
- `getPlayers({ includeUnsaved: true })` junta utilizadores registados como `player` em `avatar_rpg_users_registry` mesmo que ainda não tenham save de personagem.
- Esses cartões aparecem marcados como "Sem ficha guardada".

### Persistência local opcional via Supabase CLI
- Schema movido para `supabase/migrations/20260101000000_init.sql` (o original em `schema.sql` mantém-se como referência).
- Seed em `supabase/seed.sql` insere os utilizadores de teste e personagens iniciais.
- `npm run dev:all` faz `db:start && db:reset && dev` — garante seed dos perfis de teste em arranque local.
- Frontend ganha um caminho dual: localStorage continua a ser o default, Supabase activa-se quando `useSupabase: true` em `public/config.js` (ou `?supabase=1` na URL).
- AutoSave dispara um upsert no Supabase além do save local; falhas remotas não destroem a cópia em localStorage.
- Ver `DEV-LOCAL.md` → secção "Modo BD local".

---

## 🕳️ Decisões pendentes (precisa de input)

### 1. Tetos numéricos para Vida/Espírito/Chi/Defesa
Os campos `STAT_CAPS.maxHP`, `STAT_CAPS.maxSP`, `STAT_CAPS.maxCP` e `STAT_CAPS.defense` estão a `null` (sem cap). Precisamos de números concretos quando estiverem decididos. Esquiva já é 15.

### 2. Subclasses → Skill Tree
Adiado. A intenção é mover os bonus das subclasses para nós específicos da skill tree, em vez de uma escolha global. Decisão de desenho ainda em aberto — precisa de proposta concreta antes de mexer em `character/subclasses.js`, `Character.unlockSubclass`, UI do picker, etc.

### 3. Companheiros (Companions)
Schema já existe em `supabase/migrations/20260101000000_init.sql` (`companions` table) mas o frontend não tem UI nem regras. Backlog.

### 4. RLS em modo local
A migration inicial mantém policies estritas de Row-Level Security ligadas a `auth.uid()`. Como o frontend ainda autentica só por username (sem Supabase Auth), uma sessão `anon` não consegue ler/escrever nada quando essas policies estão activas.

**Decisão tomada:** adicionada a migration `20260628000000_relax_rls_pre_auth.sql` que substitui as policies estritas por policies permissivas (`using (true)`) — o suficiente para a fase pre-Auth. Quando a integração com Supabase Auth for feita, basta apagar essa migration (ou criar outra que reaplique policies baseadas em `auth.uid()`).

