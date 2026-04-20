# Como Correr Localmente — Avatar RPG

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+ instalado
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Conta no [Netlify](https://netlify.com/) (necessária para as Netlify Functions com API)

---

## Opção A — Frontend Apenas (sem API/backend)

A forma mais rápida de ver o frontend a funcionar.  
Não precisas de Supabase nem Netlify. Os dados são guardados no `localStorage` do browser.

```bash
# 1. Instalar dependências
npm install

# 2. Correr servidor local
npm run dev
```

Abre o browser em **http://localhost:3000**

> ⚠️ Sem backend, o login não vai funcionar.  
> O app faz fallback automático para `localStorage` se a API não responder.

---

## Opção B — Com Backend Completo (Netlify Dev)

Para testar o login, personagens guardados na base de dados, etc.

### 1. Instalar a Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Configurar as variáveis de ambiente

```bash
# Copia o ficheiro de exemplo
cp .env.example .env
```

Edita o `.env` com as tuas chaves do Supabase:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

Podes encontrar as chaves em:  
**Supabase → Projeto → Settings → API**

### 3. Inicializar a base de dados no Supabase

No painel do Supabase, vai a **SQL Editor** e corre o conteúdo do ficheiro:

```
supabase/schema.sql
```

Isto cria todas as tabelas necessárias.

### 4. Correr o servidor local com Netlify Dev

```bash
netlify dev
```

Abre o browser em **http://localhost:8888**

O Netlify Dev emula automaticamente as funções serverless (pasta `netlify/functions/`) e as rotas de API definidas no `netlify.toml`.

---

## Criar o primeiro utilizador (Admin)

Com o Netlify Dev a correr, cria o primeiro utilizador admin através do painel do Supabase:

1. Vai a **Supabase → Authentication → Users → Add User**
2. Usa o formato de email: `username@avatar-rpg.local` (ex: `admin@avatar-rpg.local`)
3. Define uma password
4. Depois, no **SQL Editor**, corre:

```sql
INSERT INTO users (auth_id, username, role)
VALUES (
  '<UUID do utilizador criado>',
  'admin',
  'admin'
);
```

A partir daí, podes fazer login com `admin` / `<password>` na aplicação.

---

## Estrutura de Pastas Relevante

```
avatar-rpg/
├── public/          ← Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── css/
│   └── js/
├── netlify/
│   └── functions/   ← API serverless
├── supabase/
│   ├── schema.sql   ← Estrutura da base de dados
│   └── seed.sql     ← (vazio — dados via importação JSON)
├── .env.example     ← Template de variáveis de ambiente
└── netlify.toml     ← Configuração de rotas da API
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Frontend apenas (http://localhost:3000) |
| `netlify dev` | Frontend + API completa (http://localhost:8888) |

---

## Notas

- O ficheiro `.env` **nunca** deve ser commitado — já está no `.gitignore`
- Na Fase 1, o app funciona sem backend (dados em `localStorage`)
- Para testar a loja, hub de jogadores e skill tree, não precisas de backend — usam dados mock
- O backend é necessário para: login persistente, guardar personagem na BD, e funcionalidades de GM
