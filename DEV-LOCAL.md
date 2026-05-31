# Como Correr Localmente — Avatar RPG

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ instalado

---

## Modo Atual — Frontend com localStorage

A aplicação corre inteiramente no browser. Não precisa de backend, Supabase ou Netlify.  
Todos os dados são guardados no `localStorage` do browser.

```bash
# 1. Instalar dependências
npm install

# 2. Correr servidor local
npm run dev
```

Abre o browser em **http://localhost:3000**

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
# Correr todos os testes (101+ testes unitários)
npm test

# Modo watch (re-corre ao guardar ficheiros)
npm run test:watch
```

Os testes cobrem lógica de jogo: stats, XP, slots, inventário, moedas, scrolls, subclasses e trocas.

---

## Estrutura de Pastas Relevante

```
avatar-rpg/
├── public/            ← Frontend (HTML, CSS, JS)
│   ├── index.html     ← Página principal (SPA)
│   ├── css/           ← Estilos (main.css + components/)
│   └── js/            ← Módulos ES6 (app.js, character/, skills/, etc.)
├── tests/             ← Testes unitários (vitest)
├── netlify/
│   └── functions/     ← API serverless (futuro — não ativo)
├── supabase/
│   ├── schema.sql     ← Estrutura da BD (futuro — não ativo)
│   └── seed.sql       ← (vazio — dados via importação JSON)
├── Initial Files/     ← JSONs de referência do protótipo
├── package.json       ← Dependencies e scripts
├── vitest.config.js   ← Configuração de testes
├── netlify.toml       ← Config Netlify (futuro)
└── .env.example       ← Template variáveis ambiente (futuro)
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor local (http://localhost:3000) |
| `npm test` | Correr testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run build` | (placeholder — sem bundler) |

---

## 🔮 Futuro — Backend com Netlify Dev + Supabase

Quando a integração com Supabase for implementada, será necessário:

1. Conta no [Supabase](https://supabase.com/) (gratuita)
2. Instalar Netlify CLI: `npm install -g netlify-cli`
3. Configurar `.env` com chaves do Supabase (ver `.env.example`)
4. Correr `netlify dev` em vez de `npm run dev` (porta 8888)

---

## Notas

- O ficheiro `.env` **nunca** deve ser commitado — já está no `.gitignore`
- A aplicação funciona totalmente sem backend (dados em `localStorage`)
- Para testar tudo (loja, hub, skill tree, admin, trocas) basta correr `npm run dev`
- Abre múltiplos tabs/browsers para simular vários jogadores
