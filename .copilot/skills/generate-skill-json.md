# Skill: Generate Skill JSON

Gera definições de habilidades em JSON para o Avatar RPG.

## Prompt

Usa este template para criar uma nova habilidade:

```json
{
  "element": "fogo|agua|terra|ar|nenhum",
  "category": "spirit|agility|precise|brute",
  "tier": 1,
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
```

## Valores Válidos

| Campo | Valores |
|-------|---------|
| `element` | fogo, agua, terra, ar, nenhum |
| `category` | spirit, agility, precise, brute |
| `tier` | 1 (Iniciante), 2 (Aprendiz), 3 (Mestre), 4 (Lendário) |
| `position` | off (ofensivo), def (defensivo), any (ambos), pass (passivo) |
| `status` | burn, freeze, shock, blind, poison, slow, stun, regen, shield, silence, root, bleed, fear |

## Validation Checklist

- [ ] `element` é um dos valores válidos
- [ ] `tier` está entre 1 e 4
- [ ] `requirements` tem todos os 6 atributos (podem ser 0)
- [ ] `position` é um dos valores válidos
- [ ] Status effects usam nomes válidos
- [ ] Notação de dados segue o formato XdY+Z

## Usar após gerar

Guardar em `Initial Files/` e validar com o skill `validate-json`:
```bash
node -e "JSON.parse(require('fs').readFileSync('Initial Files/nova-habilidade.json', 'utf8'))" && echo "✓ Valid"
```
