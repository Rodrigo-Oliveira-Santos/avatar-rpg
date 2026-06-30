# D&D 5e — App Reference

**Status:** MVP + Admin (ficha completa 5e + Hub + GM + Admin tab com impersonate)
**Updated:** 2026-06-30

## Intuito

Aplicação de fichas para *Dungeons & Dragons 5ª edição* "puro" — sem
customizações temáticas, segue as regras-base do System Reference
Document (SRD). É um espelho funcional da app Avatar adaptado às regras
5e: atributos D&D, modificadores, perícias, classes, raças, magias e
níveis 1–20.

## A quem se destina

- **Jogadores** — manter a sua ficha 5e (raça, classe, atributos,
  perícias, HP, AC, inventário, magias, features, XP/nível).
- **GM** — ver todas as fichas no Hub, atribuir XP/ouro, ver detalhes dos
  personagens.
- **Admin** — herda permissões do GM **e** tem uma tab dedicada para
  gerir utilizadores (roles, apagar conta) e editar/apagar qualquer ficha
  via modo "impersonate".

## Pilares de design

1. **5e SRD-fiel** — STR/DEX/CON/INT/WIS/CHA, point-buy ou rolls livres,
   modificadores e proficiency bonus calculados automaticamente.
2. **UI semelhante à app Avatar** — layout de 2 colunas para a ficha
   principal, tabs no topo, login overlay partilhado.
3. **Persistência por utilizador** — uma ficha por utilizador em
   `dnd_character_{username}` (mesma estratégia da app Avatar).
4. **Sessão isolada** — chaves de auth `dnd_user` / `dnd_token` (ou
   reutilização das `avatar_rpg_user` quando partilhado); ao sair faz
   teardown da sessão.

## Páginas / Tabs

| Tab        | Quem vê    | O que faz                                                                 |
|------------|------------|---------------------------------------------------------------------------|
| Ficha      | Jogador    | Identidade, abilities, modificadores, saves, HP/AC/speed, XP, level-up    |
| Perícias   | Jogador    | 18 perícias 5e com proficiência/expertise, bónus calculados               |
| Magias     | Jogador    | Spell slots por nível, DC e ataque mágico, picker do catálogo importado   |
| Inventário | Jogador    | Itens (nome/quantidade/peso/notas), ouro, itens mágicos importados        |
| Trade      | Jogador    | Propostas de troca entre jogadores (items + ouro com transferência atómica). **Badge no nav** com nº de trades pendentes recebidos. |
| Hub        | Todos      | Lista de jogadores e respetivas fichas. **Badge no nav** com nº total de fichas registadas. |
| GM         | GM/Admin   | Atribuir XP/ouro (rows individuais + bulk com confirmação visual)         |
| Importar   | GM/Admin   | Carregar JSON em 4 domínios: spells, subclasses, magic items, races       |
| Admin      | Admin      | Gerir utilizadores (roles, apagar conta), editar/apagar qualquer ficha    |

### Modo "impersonate" (Admin)

No tab Admin, o botão "✎ Editar" ao lado de outro utilizador entra em
**modo impersonate**:
- Aparece um **banner roxo** no topo da app: "👁 A editar como
  {username} (modo admin)" com um botão "← Voltar a mim".
- As tabs `Ficha`, `Perícias`, `Magias` e `Inventário` passam a editar
  a ficha do alvo. Todos os saves (autosave incluído) vão para o
  username alvo.
- Tabs `Trade`, `Hub` e `GM` continuam a operar com a sessão do admin
  (não fazem sentido em modo impersonate).
- "Voltar a mim" faz `flush` da ficha alvo e regressa à tab Admin.

API que suporta isto: `api/dnd-characters.deleteCharacter(username)` —
remove ficha do Supabase (se activo), do localStorage e do registry
secundário `dnd_characters_registry`.

## Fórmulas 5e

```text
Modifier        = floor((score − 10) / 2)
Proficiency     = ⌈level / 4⌉ + 1            (lvl 1–4: +2 … lvl 17–20: +6)
Save bonus      = ability mod + (proficient ? prof : 0)
Skill bonus     = ability mod + (proficient ? prof : 0) × (expertise ? 2 : 1)
Passive Perc.   = 10 + Perception bonus
Initiative      = DEX mod
Spell Save DC   = 8 + prof + spellcasting ability mod
Spell Attack    = prof + spellcasting ability mod
HP max          = HD + CON mod  (lvl 1) + Σ (avg HD + CON mod) por nível
```

XP table segue a tabela canónica 5e (300 → 355 000) — código em
`public/js/games/dnd/data/xp-table.js`.

## Conteúdo SRD incluído

- **Raças**: 9 raças base SRD (Human, Elf, Dwarf, Halfling, Half-Elf,
  Half-Orc, Tiefling, Dragonborn, Gnome).
- **Classes**: 12 classes base (Barbarian, Bard, Cleric, Druid, Fighter,
  Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard) com hit dice e
  proficiências base.
- **Backgrounds**: 9 backgrounds SRD (Acolyte, Criminal, …).
- **Perícias**: as 18 perícias canónicas.
- **Alignment**: as 9 combinações Lawful/Neutral/Chaotic × Good/Neutral/Evil.

> Dados em `public/js/games/dnd/data/`. O jogador escolhe livremente —
> não há lógica restritiva de "class X só pode ter skill Y"; a app é uma
> ferramenta de ficha, não um motor de regras.

## Schema (Supabase, opcional)

Ver [`MULTI-GAME-DESIGN.md`](MULTI-GAME-DESIGN.md) (`dnd_characters`). Migration adicional
em `supabase/migrations/20260629100000_multi_game_extras.sql` adiciona a
coluna `classes jsonb` para multiclass.

```sql
abilities   jsonb  -- { STR, DEX, CON, INT, WIS, CHA }
saves       jsonb  -- { STR: true, DEX: false, ... }
skills      jsonb  -- { acrobatics: { prof, expertise }, ... }
inventory   jsonb  -- [{ name, qty, weight, notes }]
spells      jsonb  -- { known: [], prepared: [], slots: { 1: {max,used}, ... } }
features    jsonb  -- [{ source, name, description }]
classes     jsonb  -- [{ class: "fighter", subclass, level }]  (multiclass)
```

## Persistência

- **Default**: localStorage por utilizador (`dnd_character_{username}`).
- **Opt-in**: Supabase via `public/js/api/dnd-characters.js` (segue o
  mesmo padrão fallback dos personagens Avatar).

## Como correr só esta app

```bash
npm run dev:dnd
```

Abre `http://localhost:3000/?game=dnd#/dnd` — landing escondido, app
arranca em modo isolado.

## Estado / Limitações conhecidas

- ✔ Ficha completa, perícias, magias, inventário, XP, level-up
- ✔ Multiclass simples (lista de classes com nível por classe; nível total
  e prof bonus calculam sobre a soma; sem prerequisitos)
- ✔ Trade entre jogadores (oferta items + ouro; aceitar transfere
  atomicamente nas duas fichas)
- ✔ Importação de packs JSON em 4 domínios (spells, subclasses, magic
  items, races) — GM only, com validadores por domínio
- ✔ Hub e GM (XP/ouro individual + bulk com feedback visual)
- ✘ Sem motor de combate (sem rolls automáticos contra DC) — *backlog*
- ✘ Sem multiclass estrito 5e (não valida ability scores mínimos por classe)
- ✘ Catálogo SRD não vem pré-carregado — o GM cola/importa o JSON
