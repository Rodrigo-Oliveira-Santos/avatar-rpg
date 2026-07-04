# Skill JSON Generator — Items

Use this template to generate new item definitions via AI.

## Prompt Template

```
Crie um JSON de item para Avatar RPG com esta estrutura:

{
  "$schema": "item-import-v1",
  "name": "Nome do Item",
  "description": "Descrição do item (1-2 frases)",
  "type": "weapon|armor|potion|material|other",
  "rarity": "comum|raro|epico|lendario",
  "price": 100,
  "price_nation": "fogo|agua|terra|ar|todas",
  "weight_class": "leve|medio|pesado",
  "armor_class": null,
  "defense_bonus": 0,
  "dodge_penalty": 0,
  "attributes": {
    "FOR": 0,
    "AGI": 0,
    "CHI": 0,
    "PER": 0,
    "RES": 0,
    "ESP": 0
  },
  "in_shop": true,
  "gm_notes": "Notas internas do GM (opcional)"
}
```

## Campos Explicados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome único do item |
| `description` | string | Descrição curta do efeito/uso |
| `type` | enum | Categoria do item |
| `rarity` | enum | Nível de raridade (apenas visual) |
| `price` | int | Preço em moedas de ouro |
| `price_nation` | enum | Nação da moeda necessária |
| `weight_class` | enum | Classe de peso (pode afetar esquiva) |
| `armor_class` | int?\| null | Apenas para armaduras |
| `defense_bonus` | int | Bónus de defesa (armaduras) |
| `dodge_penalty` | int | Penalidade de esquiva (armaduras) |
| `attributes` | object | Bónus de atributos |
| `in_shop` | bool | Visível na loja |
| `gm_notes` | string? | Notas internas do GM |

## Validation Checklist

- [ ] `type` matches one of: weapon, armor, potion, material, other
- [ ] `rarity` matches one of: comum, raro, epico, lendario
- [ ] `price_nation` matches one of: fogo, agua, terra, ar, todas
- [ ] `weight_class` matches one of: leve, medio, pesado
- [ ] `price` is a positive integer
- [ ] `attributes` has all 6 stats (can be 0)
- [ ] `armor_class` is null OR an integer (only for armor type)
- [ ] `defense_bonus` and `dodge_penalty` are integers (can be 0)

## Examples

### Armadura
```json
{
  "name": "Armadura de Placas do Fogo",
  "type": "armor",
  "rarity": "epico",
  "price": 500,
  "price_nation": "fogo",
  "weight_class": "pesado",
  "armor_class": 15,
  "defense_bonus": 20,
  "dodge_penalty": 10,
  "attributes": { "FOR": 2, "RES": 3 }
}
```

### Poção
```json
{
  "name": "Poção de Cura Menor",
  "type": "potion",
  "rarity": "comum",
  "price": 25,
  "price_nation": "todas",
  "weight_class": "leve",
  "attributes": {}
}
```
