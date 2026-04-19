# Skill: Generate Item JSON

Gera definições de itens em JSON para o Avatar RPG (armas, armaduras, poções, materiais).

## Prompt

Usa este template para criar um novo item:

```json
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
| `armor_class` | int\|null | Apenas para armaduras; null para outros |
| `defense_bonus` | int | Bónus de defesa (armaduras) |
| `dodge_penalty` | int | Penalidade de esquiva (armaduras) |
| `attributes` | object | Bónus de atributos |
| `in_shop` | bool | Visível na loja |
| `gm_notes` | string? | Notas internas do GM |

## Validation Checklist

- [ ] `type` é um dos: weapon, armor, potion, material, other
- [ ] `rarity` é um dos: comum, raro, epico, lendario
- [ ] `price_nation` é um dos: fogo, agua, terra, ar, todas
- [ ] `weight_class` é um dos: leve, medio, pesado
- [ ] `price` é um inteiro positivo
- [ ] `attributes` tem todos os 6 stats (podem ser 0)
- [ ] `armor_class` é null OU um inteiro (apenas para type: armor)
- [ ] `defense_bonus` e `dodge_penalty` são inteiros (podem ser 0)

## Exemplos

### Armadura
```json
{
  "$schema": "item-import-v1",
  "name": "Armadura de Placas do Fogo",
  "description": "Armadura pesada das forças da Nação do Fogo.",
  "type": "armor",
  "rarity": "epico",
  "price": 500,
  "price_nation": "fogo",
  "weight_class": "pesado",
  "armor_class": 15,
  "defense_bonus": 20,
  "dodge_penalty": 10,
  "attributes": { "FOR": 2, "AGI": 0, "CHI": 0, "PER": 0, "RES": 3, "ESP": 0 },
  "in_shop": true
}
```

### Poção
```json
{
  "$schema": "item-import-v1",
  "name": "Poção de Cura Menor",
  "description": "Restaura 20 pontos de vida ao consumir.",
  "type": "potion",
  "rarity": "comum",
  "price": 25,
  "price_nation": "todas",
  "weight_class": "leve",
  "armor_class": null,
  "defense_bonus": 0,
  "dodge_penalty": 0,
  "attributes": { "FOR": 0, "AGI": 0, "CHI": 0, "PER": 0, "RES": 0, "ESP": 0 },
  "in_shop": true
}
```
