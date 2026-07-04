# Skill: Validate JSON

Valida ficheiros JSON do projeto para garantir que são JSON válido.

## Uso

### Validar todos os ficheiros de dados do jogo

```bash
bash .claude/skills/validate-json.sh
```

### Validar um ficheiro específico

```bash
bash .claude/skills/validate-json.sh "Initial Files/fire-skills.json"
```

### Validar manualmente com Node.js

```bash
node -e "JSON.parse(require('fs').readFileSync('Initial Files/fire-skills.json', 'utf8'))" && echo "✓ Valid" || echo "✗ Invalid JSON"
```

## Output Esperado

```
Validating JSON files: Initial Files/*.json
Checking Initial Files/air-skills.json... ✓ Valid
Checking Initial Files/earth-skills.json... ✓ Valid
Checking Initial Files/fire-skills.json... ✓ Valid
Checking Initial Files/water-skills.json... ✓ Valid
Checking Initial Files/no-bending-skills.json... ✓ Valid
```

## Quando Usar

- Após gerar novos JSONs com o skill `generate-skill-json` ou `generate-item-json`
- Antes de importar dados via a página de Import/Export do GM
- Após editar manualmente qualquer ficheiro `.json` em `Initial Files/`
