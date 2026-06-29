# Avatar RPG — App Reference

**Status:** Phases 1–6 complete (production-ready in localStorage mode; Supabase opt-in)
**Updated:** 2026-06-29

## Intuito

App de gestão de fichas de personagem para um RPG de mesa inspirado em
*Avatar: The Last Airbender*. Pensada para ser usada à volta da mesa ou em
sessões online — cada jogador entra com o seu utilizador, vê apenas a sua
ficha, e o GM tem ferramentas para recompensar o grupo, importar
conteúdos e gerir a sessão.

## A quem se destina

- **Jogadores** — gerir o seu próprio personagem (atributos, dobra, skills,
  inventário, XP, ouro, level-up).
- **GM (Game Master)** — distribuir recompensas (XP, ouro, loot), importar
  packs de skills/items via JSON, ver todos os personagens.
- **Admin** — gerir utilizadores, fazer backup/restore, ver logs do sistema.

## Pilares de design

1. **Tema fiel ao universo** — quatro elementos (Fogo, Água, Terra, Ar) +
   "Sem Dobra" para personagens não-dobradores, com subclasses (ex.: Dobra
   de Metal, Dobra de Sangue, Raio Azul).
2. **Stats próprias do sistema** — atributos FOR/AGI/CHI/PER/RES/ESP e
   recursos Vida / Espírito / Chi com fórmulas próprias (ver
   `copilot-instructions.md`).
3. **Multi-moeda por nação** — cada nação tem moeda própria (`ouro_terra`,
   `gelo_polar`, etc.), conversíveis entre si na loja.
4. **Sessão isolada** — quando se sai da app, a sessão é fechada;
   reentrar pede login. As chaves de auth são `avatar_rpg_user` /
   `avatar_rpg_token`.

## Páginas / Tabs

| Tab        | Quem vê    | O que faz                                                          |
|------------|------------|--------------------------------------------------------------------|
| Personagem | Jogador    | Identidade, atributos, subclasse, stats de combate, equipamento    |
| Fogo/Água/Terra/Ar/Sem Dobra | Jogador | Árvore de skills da sua dobra (cards + sub-skills + slots) |
| Itens      | Jogador    | Inventário, equipar/desequipar, scrolls                            |
| Loja       | Jogador    | Compra/venda em multi-moeda                                        |
| Jogadores  | Todos      | Hub: lista de jogadores, ficha de outro, ofertas, trocas           |
| Importar   | GM         | Upload de JSON de skills/items (validado)                          |
| Admin      | Admin      | Gestão de utilizadores, backup/restore, logs                       |

## Fórmulas do sistema

```text
Vida     = 10 + (nivel × 8) + (FOR × 3)
Chi      = 6  + (nivel × 5) + (CHI × 4)
Espírito = 8  + (nivel × 6) + (ESP × 3)
Defesa   = (RES × 2) + nivel + armor_bonus
Esquiva  = 10 + ((AGI × 2) + PER) × 0.2 − armor_penalty   (cap 15)
XP next  = round(200 × (nivel − 1)^1.55)
Pontos por nível = 3        Nível máximo = 40
```

Caps configuráveis em `public/js/utils/constants.js` (`STAT_CAPS`).

## Persistência

- **Default**: localStorage por utilizador
  (`avatar_rpg_character_{username}`).
- **Opt-in**: Supabase (ver `public/config.js` → `useSupabase: true` ou
  `?supabase=1`). Schema em `supabase/schema.sql`.

## Estrutura de pastas

```
public/js/
├── auth/          AuthManager (login overlay partilhado)
├── character/     Modelo Character + cálculos
├── skills/        SkillTree, cards, sub-skills, slot limits
├── items/         InventoryPage, equip/unequip
├── shop/          Loja multi-moeda
├── hub/           HubPage, CharacterModal, GroupRewards, LootDelivery
├── import/        GM JSON import (validators + storage)
├── trade/         TradeManager, TradeModal
├── admin/         AdminPanel, BackupRestore, LogService, LogViewer
├── storage/       AutoSave + export/import JSON
├── combat/        Dados, resolver, efeitos
└── games/avatar/  Entrypoint (delega no `App`)
```

## Como correr só esta app

```bash
npm run dev:avatar
```

O script abre `http://localhost:3000/?game=avatar#/avatar` — o landing
(seletor de jogos) fica escondido, é equivalente a ter só a app Avatar
no domínio. Para correr tudo (multi-game) usa `npm run dev`.

## Referências cruzadas

- `FEATURES.md` — checklist de funcionalidades.
- `DIAGRAMAS-NÃO-TÉCNICOS.md` — fluxos de jogo.
- `DIAGRAMAS-TÉCNICOS.md` — arquitetura, schema, API, JSON de import.
- `DEV-LOCAL.md` — Supabase local.
