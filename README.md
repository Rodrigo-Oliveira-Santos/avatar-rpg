# Avatar RPG — Sistema de Personagem Web

## Visão Geral

Sistema de RPG customizado inspirado em **Avatar: The Last Air Bender**, estilo D&D, com foco em:
- Distribuição de atributos (FOR, AGI, CHI, PER, RES, ESP)
- Progressão por níveis (máx 40)
- Desbloqueio de habilidades por elemento (Fogo, Água, Terra, Ar, Sem Dobra)
- Sistema de combate com dados, status effects e custos de Chi

**Público:** Você e seus amigos. Multi-usuário com autenticação simples (nome do personagem).

**Estado atual:** Protótipo com dados em `Initial Files/`. Próximo passo: construir a aplicação web funcional.

---

## Arquitetura Proposta

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   Supabase      │
│   (Vue.js 3 +   │     │   (Node.js +     │     │   (PostgreSQL   │
│   Tailwind CSS) │◀────│   Express)       │◀────│   + Auth)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
  Netlify (free)         Railway/Render (free)    Supabase (free tier)
```

### Por que estas escolhas?

| Componente | Tecnologia | Justificativa |
|------------|------------|---------------|
| Frontend | Vue.js 3 + Tailwind | Reatividade para filtros, curva suave, responsivo nativo |
| Backend | Node.js + Express | Leve, iterativo, ecosysteme vasto |
| Database | Supabase | Auth incluso, real-time, backups, 500MB free |
| Deploy FE | Netlify | Deploy automático do Git, custom domain free |
| Deploy BE | Railway | 500hrs/mês free, Node.js nativo |

---

## Sistema de Jogo

### Atributos

| Atributo | Descrição | Fórmula Derivada |
|----------|-----------|------------------|
| **FOR** (Força) | Dano físico, requisitos de armas | — |
| **AGI** (Agilidade) | Esquiva, velocidade | Esquiva = AGI×2 + PER |
| **CHI** (Chi) | Energia para habilidades | Chi máx = 6 + (nível×5) + (CHI×4) |
| **PER** (Percepção) | Precisão, detecção | — |
| **RES** (Resistência) | Defesa física | Defesa = RES×2 + nível |
| **ESP** (Espírito) | Vida espiritual, cura | Espírito máx = 8 + (nível×6) + (ESP×3) |

**Vida:** 10 + (nível × 8) + (FOR × 3)

### Progressão

- **Nível máximo:** 40
- **Pontos por nível:** 3 (distribuídos livremente)
- **XP para próximo nível:** `round(200 × (nível-1)^1.55)`
- **Marcos:** Aprendiz (5), Discípulo (10), Praticante (15), Veterano (20), Especialista (25), Mestre (30), Grande Mestre (35), Lendário (40)

### Habilidades

- Organizadas por **elemento** → **categoria** → **tier**
- **Categorias:** Espiritualidade, Agilidade, Combate Preciso, Combate Bruto
- **Tiers:** Iniciante (1), Avançado (2), Mestre (3), Lendário (4)
- **Requisitos:** Atributos mínimos + habilidades prévias desbloqueadas
- **Sub-habilidades:** 2 slots base + 1 a cada 3 níveis. Pergaminhos ultrapassam o cap de 3 por habilidade.

### Elementos

| Elemento | Status |
|----------|--------|
| Fogo | ✅ Completo (JSON + HTML) |
| Água | ✅ Completo (JSON + HTML) |
| Terra | ⚠️ Pendente (notas no JSON) |
| Ar | ⚠️ Pendente (notas no JSON) |
| Sem Dobra | ⚠️ Pendente (notas no JSON) |

---

## Funcionalidades Planejadas

### MVP (Fase 1)

- [ ] Autenticação simples (nome do personagem)
- [ ] Criação de personagem (nome, elemento, aparência)
- [ ] Ficha de personagem com atributos editáveis
- [ ] Árvore de habilidades visual e interativa
- [ ] Auto-save (debounce 2s após mudança)
- [ ] Exportar personagem para JSON
- [ ] Importar personagem de JSON

### Fase 2 (Import System)

- [ ] Importar JSON de habilidades (novos elementos, sub-classes)
- [ ] Validador de schema
- [ ] Prompt template para chatbots gerarem conteúdo compatível

### Fase 3 (GM Tools)

- [ ] Role de GM (flag na conta)
- [ ] Criador de encontros/inimigos
- [ ] Visualizar sheets de todos os jogadores
- [ ] Simulador de combate básico

### Futuro (Backlog)

- [ ] Auto-backups agendados
- [ ] Histórico de sessões (anotações por sessão)
- [ ] Sistema de inventário completo
- [ ] Integração com Discord (webhooks)
- [ ] Modo offline (PWA + IndexedDB)
- [ ] Tradução PT/EN

---

## Schema de Importação (Exemplo)

Para gerar novos conteúdos via chatbot, use este prompt:

```
Crie um JSON de habilidade para Avatar RPG com esta estrutura:

{
  "element": "fogo|agua|terra|ar|nenhum",
  "category": "spirit|agility|precise|brute",
  "tier": 1-4,
  "name": "Nome da Habilidade",
  "description": "Descrição curta (1-2 frases)",
  "requirements": { "FOR": 0, "AGI": 0, "CHI": 0, "PER": 0, "RES": 0, "ESP": 0 },
  "prerequisites": ["Nome da Habilidade Prévia"],
  "position": "off|def|any|pass",
  "attacks": [
    {
      "name": "Nome do Ataque",
      "description": "Descrição do ataque",
      "damage": "2d6+2",
      "chi_cost": 3,
      "status": ["burn", "stun"]
    }
  ],
  "passive_effect": {
    "type": "buff|debuff|restore|heal|move|utility",
    "dice": "1d6",
    "chi_cost": 2,
    "description": "O que o efeito faz",
    "status": ["regen"]
  }
}

Status válidos: burn, freeze, shock, blind, poison, slow, stun, regen, shield, silence, root, bleed, fear
```

---

## Estrutura do Projeto (Proposta)

```
avatar-rpg/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CharacterSheet.vue
│   │   │   ├── AttributePanel.vue
│   │   │   ├── SkillTree.vue
│   │   │   └── SkillCard.vue
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   ├── Dashboard.vue
│   │   │   └── CharacterEditor.vue
│   │   ├── stores/
│   │   │   └── character.js (Pinia)
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.vue
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── characters.js
│   │   │   └── import.js
│   │   ├── middleware/
│   │   │   └── session.js
│   │   └── index.js
│   └── package.json
├── database/
│   └── schema.sql (tabelas Supabase)
├── Initial Files/
│   └── (arquivos atuais de referência)
└── README.md
```

---

## Próximos Passos Imediatos

1. **Configurar repositório Git** com estrutura proposta
2. **Criar projeto Supabase** (free tier) e configurar tabelas
3. **Setup do frontend Vue.js** com Tailwind
4. **Implementar login simples** (nome do personagem → session token)
5. **Criar ficha de personagem** baseada no JSON atual
6. **Implementar auto-save** com debounce
7. **Exportar/Importar JSON**

---

## Notas de Desenvolvimento

- **Flexibilidade > Perfeição:** Priorize funcional sobre bem arquitetado. Refatore quando necessário.
- **Auto-save é crítico:** Usuário não deve precisar pensar em salvar.
- **Import system é prioridade:** Conteúdo gerado por IA deve ser plug-and-play (Fase 2).
- **GM tools podem esperar:** Foque na experiência individual do jogador primeiro.

---

## Contato / Contribuidores

Projeto pessoal para grupo de RPG. Contribuições internas bem-vindas.
