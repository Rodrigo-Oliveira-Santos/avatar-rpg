# Skill JSON Generator

Use this template to generate new skill definitions via AI.

## Prompt Template

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

## Validation Checklist

- [ ] `element` matches one of: fogo, agua, terra, ar, nenhum
- [ ] `tier` is between 1-4
- [ ] `requirements` has all 6 attributes
- [ ] `position` is one of: off, def, any, pass
- [ ] Status effects use valid names
- [ ] Dice notation follows XdY+Z format
