# Minecraft Builds — App Reference

**Status:** MVP + Admin (galeria pública + painel pessoal + tab admin com transfer/delete)
**Updated:** 2026-06-30

## Intuito

Mostra e partilha *Minecraft builds* (construções, redstone, farms,
adventure maps, etc.). Cada build é uma combinação de **imagem + título
+ descrição + link de download** — o ficheiro real (`.schematic`,
`.litematic`, `.nbt`, `.zip`) **vive no Google Drive de quem a
partilhou**; o site limita-se a guardar o link e a thumbnail.

Foi pensada para ser leve em armazenamento: **zero blobs na DB**, zero
upload de imagens — só URLs.

## A quem se destina

- **Visitantes** — qualquer pessoa pode ver a galeria sem login.
- **Utilizadores autenticados** — têm um "Painel Pessoal" para adicionar,
  editar e apagar as suas próprias builds + "Minhas Listas" para
  organizar bookmarks.
- **Admins** — têm uma tab "Admin" adicional: gerir roles, apagar
  contas, listar/editar/apagar/transferir TODAS as builds (single ou
  bulk por utilizador).

## Pilares de design

1. **Galeria pública** — entra-se sem login; só o painel pessoal pede
   credenciais.
2. **Estilo "pasta do Windows"** — duas vistas alternáveis:
   - **Grelha de ícones grandes** (thumbnails), clique abre o painel
     de detalhe lateral.
   - **Lista detalhada** (linha): `[thumb] | [título + descrição] |
     [botão Download]`.
3. **Filtros e categorias** — pesquisa por texto + filtro por categoria
   (survival, redstone, farm, estético, aventura, outro).
4. **Sem upload** — só URLs Google Drive. O site converte
   automaticamente:
   - Link de partilha → URL direto de imagem (`uc?export=view&id=...`)
   - Link de partilha → URL direto de download (`uc?export=download&id=...`)

## Fluxo de utilização

```
1. Visitante abre a app → vê galeria pública (toda a gente).
2. Quer adicionar uma build → clica "Painel Pessoal" → login overlay.
3. Após login → painel com as suas builds + botão "Adicionar Build".
4. Form pede: título, descrição, categoria, Drive thumb URL, Drive download URL.
5. Submete → entra na DB com `owner_id = user.id`.
6. Aparece automaticamente na galeria pública.
7. Pode editar ou apagar a qualquer altura no painel.
```

## Como obter os links do Google Drive

Para uma imagem ou ficheiro no Drive:

1. Carrega para o Drive.
2. Clica direito → **Partilhar** → torna acessível "qualquer pessoa com
   o link".
3. Copia o link de partilha. Vai ter este formato:
   `https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing`
4. Cola esse link **tal e qual** no formulário; o site extrai o
   `FILE_ID` e gera automaticamente:
   - Para thumbnail: `https://drive.google.com/uc?export=view&id=<FILE_ID>`
   - Para download: `https://drive.google.com/uc?export=download&id=<FILE_ID>`

> **Nota**: o Drive pode mostrar uma página intersticial de aviso para
> ficheiros grandes — é normal e o utilizador final clica "Transferir
> mesmo assim". Sem solução do lado do site (limitação do Drive).

## Páginas / Tabs

| Tab            | Quem vê             | O que faz                                              |
|----------------|---------------------|--------------------------------------------------------|
| Galeria        | Público             | Lista todas as builds com filtros e duas vistas        |
| Painel Pessoal | Autenticado         | CRUD das builds do utilizador                          |
| Minhas Listas  | Autenticado         | Cria/renomeia/apaga playlists; vê builds por lista     |
| Admin          | Admin               | Gerir users (roles, apagar conta), edit/delete/transfer builds |

### Tab Admin (Admin only)

- **Utilizadores**: tabela com role mgmt (mesmas regras do registry
  partilhado), contagem de builds por user e botão
  "📦 Transferir N builds" para passar **todas** as builds de um user
  para outro (escolha de destino via modal `lib/user-picker`).
- **Todas as builds**: lista cada build com botões "✎ Editar"
  (reutiliza o form), "📦 Transferir" (single, escolha de novo dono)
  e "🗑 Apagar".

API que suporta isto: `api/mc-builds.js` adicionou
`transferBuild(buildId, toUsername)` e
`transferAllBuildsFromUser(fromUsername, toUsername)`.

## Schema (Supabase, opcional)

Ver [`MULTI-GAME-DESIGN.md`](MULTI-GAME-DESIGN.md) (`mc_builds`). Migration adicional em
`supabase/migrations/20260629100000_multi_game_extras.sql` adiciona
`video_url` e `social_url`. Versão completa guardada na DB:

```sql
id              uuid
owner_id        uuid (FK users)
title           text
description     text
thumbnail_url   text          -- URL externo, nunca um BLOB
download_url    text          -- URL Drive (uc?export=download&id=...)
category        text          -- enum check
tags            text[]        -- tags livres (ver índice GIN)
mc_version      text          -- opcional ("1.20", "1.20.1", …)
video_url       text          -- opcional (YouTube)
social_url      text          -- opcional (Instagram / outro)
created_at      timestamptz
updated_at      timestamptz
```

Linha típica ~300B–3 KB → mesmo com milhares de builds o footprint da
DB é negligível (thumbnails e ficheiros estão no Drive).

## Persistência

- **Default**: localStorage (`mc_builds`). É um array global porque a
  galeria é pública — não há partição por utilizador.
- **Opt-in**: Supabase via `public/js/api/mc-builds.js` (segue o padrão
  fallback dos restantes APIs).

## Permissões

| Operação       | Quem                                            |
|----------------|-------------------------------------------------|
| Ver galeria    | Qualquer pessoa (sem login)                     |
| Criar build    | Qualquer utilizador autenticado                 |
| Editar build   | `owner_id == user.id` OU role `admin`           |
| Apagar build   | `owner_id == user.id` OU role `admin`           |

## Como correr só esta app

```bash
npm run dev:minecraft
```

Abre `http://localhost:3000/?game=minecraft#/minecraft` — landing
escondido, app arranca isolada.

## Estado / Limitações conhecidas

- ✔ Galeria pública com duas vistas, filtros por categoria e por tag
- ✔ Painel pessoal: criar, editar, apagar
- ✔ Conversão Drive → URL direto (thumb + download)
- ✔ Validação assíncrona ao colar link Drive (probe da imagem)
- ✔ Tags livres (filtro chips na galeria)
- ✔ Links sociais opcionais por build (YouTube, Instagram, fallback genérico)
  com ícones na lista e no painel de detalhe
- ✔ **Likes / Dislikes** tipo YouTube (mutuamente exclusivos, login
  obrigatório, count visível em tile/row/detalhe)
- ✔ **Bookmarks / Listas pessoais** tipo playlists do YouTube: cada user
  cria N listas, popover de checkboxes para guardar uma build em várias
  listas; tab "Minhas Listas" para gerir
- ✘ Sem comentários
- ✘ Sem moderação (uso por amigos)
- ✘ Drive download: privacidade do ficheiro não pode ser auto-testada
  (limitação de CORS); responsabilidade do utilizador garantir
  "qualquer pessoa com o link"
