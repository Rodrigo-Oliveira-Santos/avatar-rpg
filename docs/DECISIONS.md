# Avatar RPG — Decisões e Pendentes

**Última atualização:** 2026-06-30

Este documento centraliza decisões de design tomadas (ou ainda em aberto) que afectam a implementação. Manter aqui evita-as perderem-se no histórico.

> **Nota:** Este documento é específico da app Avatar. Para D&D 5e e
> Minecraft Builds, ver respectivamente
> [`DND-APP.md`](./DND-APP.md) e [`MINECRAFT-APP.md`](./MINECRAFT-APP.md).
> Para arquitetura multi-game e admin panels cross-app, ver
> [`MULTI-GAME-DESIGN.md`](./MULTI-GAME-DESIGN.md).

---

## ✅ Decisões aplicadas

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

### Hub do GM lista jogadores sem ficha
- `getPlayers({ includeUnsaved: true })` junta utilizadores registados como `player` em `avatar_rpg_users_registry` mesmo que ainda não tenham save de personagem.
- Esses cartões aparecem marcados como "Sem ficha guardada".

### Persistência local opcional via Supabase CLI
- Schema movido para `supabase/migrations/20260101000000_init.sql` (o original em `schema.sql` mantém-se como referência).
- Seed em `supabase/seed.sql` insere os utilizadores de teste e personagens iniciais.
- Frontend ganha um caminho dual: localStorage continua a ser o default, Supabase activa-se quando `useSupabase: true` em `public/config.js` (ou `?supabase=1` na URL).
- AutoSave dispara um upsert no Supabase além do save local; falhas remotas não destroem a cópia em localStorage.
- Ver [`DEV-LOCAL.md`](./DEV-LOCAL.md) → secção "Modo BD local".

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
