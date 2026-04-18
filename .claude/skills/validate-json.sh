#!/bin/bash
# Validate game data JSON files
# Usage: ./validate-json.sh [file.json]

cd "$(dirname "$0")/.."

JSON_FILE="${1:-Initial Files/*.json}"

echo "Validating JSON files: $JSON_FILE"

for file in $JSON_FILE; do
    if [ -f "$file" ]; then
        echo -n "Checking $file... "
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            echo "✓ Valid"
        else
            echo "✗ Invalid JSON"
        fi
    fi
done
