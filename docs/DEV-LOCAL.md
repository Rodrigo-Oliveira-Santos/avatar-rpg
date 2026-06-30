# Como Correr Localmente — Avatar RPG (Multi-game)

> **Plataforma multi-app**: este projeto aloja Avatar RPG + D&D 5e +
> Minecraft Builds. Por defeito abre a landing com seletor de jogo.
> Para arrancar uma app individual, ver "Comandos" abaixo.

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ instalado

---

## Modo Atual — Frontend com localStorage

A aplicação corre inteiramente no browser. Não precisa de backend, Supabase ou Netlify.  
Todos os dados são guardados no `localStorage` do browser.

```bash
# 1. Instalar dependências
npm install

# 2. Correr servidor local (landing + 3 apps)
npm run dev

# … ou abrir apenas uma app (esconde a landing)
npm run dev:avatar
npm run dev:dnd
npm run dev:minecraft
```

Abre o browser em **http://localhost:3000**

> **Nota sobre `public/serve.json`:** este ficheiro instrui o `serve` a enviar headers de Cross-Origin Isolation (`COOP=same-origin` + `COEP=require-corp`) em todos os pedidos. É necessário para o **mapa interativo** embedido no Hub (que corre num runtime Godot e precisa de `SharedArrayBuffer`). Se removeres este ficheiro o resto da app continua a funcionar, mas o mapa vai mostrar um erro.

### Login

O sistema usa autenticação simples por username (sem password). Utilizadores pré-definidos:

| Username | Role | Elemento |
|----------|------|----------|
| `zuko` | player | Fogo |
| `katara` | player | Água |
| `toph` | player | Terra |
| `aang` | player | Ar |
| `sokka` | player | Non-Bending |
| `gm` | gm | — |
| `admin` | admin | — |

Podes também escrever qualquer username novo — será criado como jogador.

---

## Testes

```bash
# Correr todos os testes (vitest)
npm test

# Modo watch (re-corre ao guardar ficheiros)
npm run test:watch
```

Os testes cobrem lógica de jogo Avatar (stats, XP, slots, inventário,
moedas, scrolls, subclasses, trocas), API Avatar, e os módulos das
apps adicionais (D&D character/trade/import/mapper, MC reactions/
lists/transfer/social/drive, router, users-registry partilhado,
delete-user cascata, dnd-delete-character).

---

## Estrutura de Pastas Relevante

```
avatar-rpg/
├── public/            ← Frontend (HTML, CSS, JS)
│   ├── index.html     ← SPA (todos os jogos)
│   ├── css/           ← Estilos (main.css + components/)
│   └── js/
│       ├── main.js, router.js, app.js
│       ├── games/     ← Multi-game scaffolding
│       │   ├── landing/   (game selector + Admin Global)
│       │   ├── lib/       (shared-auth, users-registry, …)
│       │   ├── back-widget.js
│       │   ├── avatar/    (delega no App existente)
│       │   ├── dnd/       (entrypoint + pages + data SRD)
│       │   └── minecraft/ (entrypoint + pages + lib)
│       ├── admin/, auth/, character/, skills/, items/, shop/, hub/,
│       │   import/, trade/, combat/, storage/, utils/   ← Avatar
│       └── api/       ← Avatar + dnd-characters + mc-builds/…
├── tests/             ← Testes unitários (vitest, 25 ficheiros / 332 testes)
├── netlify/
│   └── functions/     ← API serverless (Avatar)
├── supabase/
│   ├── migrations/    ← 5 migrations (init + relax-RLS + multi-game + extras + mc-reactions/lists)
│   ├── schema.sql     ← Legacy (referência; migrations são canónicas)
│   └── seed.sql       ← Utilizadores de teste + fichas iniciais
├── docs/              ← Documentação humana (FEATURES, DECISIONS, DIAGRAMAS-*, *-APP, MULTI-GAME-DESIGN)
├── scripts/dev-game.js ← launcher single-game (?game=<id>)
├── CLAUDE.md, .github/copilot-instructions.md  ← context p/ agentes
├── package.json, vitest.config.js
├── netlify.toml
└── .env.example
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor local com **landing + 3 apps** (http://localhost:3000) |
| `npm run dev:avatar` | Apenas a app Avatar RPG (esconde a landing) |
| `npm run dev:dnd` | Apenas a app D&D 5e |
| `npm run dev:minecraft` | Apenas a app Minecraft Builds |
| `npm test` | Correr testes unitários (332 testes) |
| `npm run test:watch` | Testes em modo watch |
| `npm run build` | (placeholder — sem bundler) |
| `npm run db:start` | (opcional) Arranca Supabase local |
| `npm run db:stop` | (opcional) Pára Supabase local |
| `npm run db:reset` | (opcional) Reaplica migrations + seed |
| `npm run db:status` | (opcional) Estado do Supabase local |
| `npm run dev:all` | (opcional) Arranca Supabase, **reaplica seed com perfis de teste** e o frontend numa só linha |

---

## 🔮 Futuro — Backend com Supabase CLI (modo BD local)

A app continua a funcionar 100% em localStorage por defeito. Quando quiseres começar a guardar/ler de uma BD igual à de produção, podes ligar o Supabase localmente.

### 1. Instalar e arrancar

```bash
# Instala a CLI do Supabase como dev dep
npm install

# Inicializa o projeto Supabase (1ª vez) — gera supabase/config.toml
npx supabase init

# Arranca os contentores Docker (Postgres + Studio + Storage + Auth)
npm run db:start
```

Endereços úteis (defaults da CLI):
- API REST: `http://127.0.0.1:54321`
- Studio (UI web): `http://127.0.0.1:54323`
- Postgres: `postgres://postgres:postgres@127.0.0.1:54322/postgres`

### 2. Aplicar schema + seed

```bash
# Aplica todas as migrations em supabase/migrations/ e corre seed.sql
npm run db:reset
```

A migration `20260101000000_init.sql` cria as tabelas (espelha o `supabase/schema.sql` legado) e o `seed.sql` insere os utilizadores de teste e fichas iniciais. A migration `20260628000000_relax_rls_pre_auth.sql` relaxa as policies de RLS para permitir que a app funcione com a `anon key` enquanto não há Supabase Auth — remove esta migração quando a integração com Auth for adicionada.

### 3. Ligar o frontend ao Supabase

```bash
cp public/config.example.js public/config.js
# Edita public/config.js e coloca useSupabase: true
```

Recarrega o browser. A partir daí o `AutoSave` faz upsert do personagem em `characters` em paralelo com o `localStorage`. Para alternar rapidamente sem editar o ficheiro, usa `http://localhost:3000/?supabase=1` (ou `?supabase=0` para desligar).

### 4. Notas e limitações actuais

- A migration deixa `auth_id` nullable para permitir login só por username em modo local. Em produção volta-se a exigir Supabase Auth.
- As policies estritas de RLS são substituídas pela migration `20260628000000_relax_rls_pre_auth.sql` por policies permissivas (`using (true)`) enquanto não há Auth — remover essa migration quando o Auth for integrado.
- O cliente Supabase é carregado por ESM dinâmico do `esm.sh` na primeira utilização — não há bundle adicional.
- Em modo Supabase activo (`useSupabase: true`), todas as APIs (`characters`, `skills`, `items`, `notifications`, `auth`) falam directamente com Postgres via PostgREST. Quando desligado, voltam a usar localStorage / arrays vazios.

### 5. O que está no seed (`supabase/seed.sql`)

`npm run db:reset` deixa a BD num estado determinístico, ideal para testes:

- **7 utilizadores**: `admin`, `gm` e 5 jogadores (`zuko`, `katara`, `toph`, `aang`, `sokka`).
- **5 personagens** completas (uma por jogador), com identidade, atributos, `combat_path`/`non_bender_path`, `skills_data`, `inventory_data`, `equipment_data`, `status_effects`, `player_notes` e `gm_notes` populados (estes últimos vazios por defeito).
- **12 itens** no catálogo (8 marcados `in_shop=true` que aparecem na loja, 4 só disponíveis via GM/loot).
- **3 monstros de exemplo** (Bandido das Estradas, Espírito Maligno, Capitão Imperial) — usados para popular a tab "Monstros" do GM. Todos com `is_staged=false` e `is_dead=false` por defeito (`is_staged` = selecionado para a próxima batalha).
- **Tabelas de combate** (`encounters`, `encounter_combatants`) vazias — uma batalha é criada via `BattleLauncher` na tab Monstros.
- **Vitals** (`hp_current`, `cp_current`, `sp_current`) começam `null` — recomputam para o máximo no primeiro load. A partir daí persistem entre sessões.
- **Tabela `shop_profiles`** vazia — o GM cria perfis em `Loja → 🛠 Gerir` clicando em `💾 Guardar atual como perfil`.
- **Tabela `trades`** vazia — populada pelas propostas dos jogadores e pelos forced transfers do GM.

Tudo é idempotente (`on conflict (id|username|name) do update set …`), por isso podes correr `db:reset` as vezes que quiseres sem recriar dependências.

### 6. Testar persistência total (Supabase + AutoSave + flush no logout)

Fluxo recomendado para validar a persistência:

1. `npm run db:reset` para repor a seed.
2. `npm run dev` e abrir `http://localhost:3000`.
3. Login com qualquer perfil de teste (ex.: `zuko`). A ficha é carregada do Supabase.
4. Fazer alterações (atributos, desbloquear skill, comprar item).
5. Carregar no botão de logout (⏻) — o AutoSave dá `flush()` antes de fechar a sessão.
6. Refazer login: as alterações devem persistir porque foram gravadas no Supabase, mesmo limpando `localStorage` (DevTools → Application → Clear site data).

Para testar como um novo jogador (sem seed), faz login com um username novo: o `preset` é aplicado (se houver) e o `App.loadCharacter()` chama `API.characters.create(...)` para gravar a personagem no Supabase logo no primeiro login.

### 7. Testar o sistema de turnos

1. Login como `gm` (ou `admin`).
2. Vai a **Monstros** → coloca pelo menos um monstro em jogo (`Colocar em jogo`).
3. Clica `⚔ Iniciar batalha` → seleciona quem participa → introduz/rola a iniciativa de cada um (default manual; toggle `🎲 Rodar` no popup para a app rolar por ti).
4. Vai ao **Hub**: vês a ordem completa no painel `⚔ Combate`, com indicador animado no combatente activo e número de iniciativa nos cards.
5. Logout, login como um jogador (`zuko`, `katara`…). Hub atualiza-se sozinho via Supabase Realtime — sem refresh manual. No teu turno aparece `Fim do meu turno`.
6. De volta como `gm`: `Próximo turno →` corre os ticks dos efeitos (popup pede valor do dano/cura) e avança o cursor.

Sem Supabase ligado (`useSupabase: false`), tudo continua a funcionar via localStorage mas o Realtime degrada para polling 3s (apenas a mesma janela vê actualizações).

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run db:start` | Arranca Supabase local (Docker) |
| `npm run db:stop` | Pára Supabase local |
| `npm run db:reset` | Reaplica migrations + seed |
| `npm run db:status` | Mostra portas e URLs ativos |
| `npm run dev:all` | **Arranca Supabase local, aplica migrations + seed (test profiles) e o frontend numa só linha** (faz `db:start`, `db:reset` e depois `dev`). ⚠️ Reseta os dados — usa `npm run db:start && npm run dev` se quiseres preservar o estado. Para terminar: `Ctrl+C` no servidor + `npm run db:stop`. |

### Alternativa sem Docker — projeto remoto

Se preferires não usar Docker, cria um projeto grátis em [supabase.com](https://supabase.com), corre o conteúdo de `supabase/migrations/20260101000000_init.sql` no SQL Editor e depois o `seed.sql`. No `public/config.js`, substitui `url` e `anonKey` pelos valores do teu projeto (Settings → API).

---

## Notas

- O ficheiro `.env` **nunca** deve ser commitado — já está no `.gitignore`
- A aplicação funciona totalmente sem backend (dados em `localStorage`)
- Para testar tudo (loja, hub, skill tree, admin, trocas) basta correr `npm run dev`
- Abre múltiplos tabs/browsers para simular vários jogadores
