# Skill: Run Dev

Corre o servidor de desenvolvimento local para o projeto.

## Pré-requisitos

```bash
npm install
```

## Comandos

### Frontend (padrão)

```bash
bash .claude/skills/run-dev.sh
# ou equivalente:
cd frontend && npm run dev
```

### Backend (Netlify Functions)

```bash
bash .claude/skills/run-dev.sh backend
# ou equivalente:
cd backend && npm run dev
```

### Ambos em simultâneo (dois terminais)

```bash
# Terminal 1
bash .claude/skills/run-dev.sh frontend

# Terminal 2
bash .claude/skills/run-dev.sh backend
```

## URLs de Desenvolvimento

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 (ou porta configurada) |
| Netlify Functions | http://localhost:8888/.netlify/functions/ |

## Notas

- O frontend usa Netlify Dev para proxiar as funções localmente
- Variáveis de ambiente Supabase devem estar em `.env` (não commitar)
- Ver `netlify.toml` para configuração de deploy e redirects
