#!/bin/bash
# Create a new frontend component (HTML/CSS/JS vanilla)
# Usage: ./new-component.sh ComponentName

if [ -z "$1" ]; then
    echo "Usage: ./new-component.sh ComponentName"
    exit 1
fi

COMPONENT_NAME="$1"
JS_PATH="public/js/components/${COMPONENT_NAME}.js"
CSS_PATH="public/css/components/$(echo "$COMPONENT_NAME" | sed 's/\([A-Z]\)/-\L\1/g' | sed 's/^-//').css"

# Create directories if they don't exist
mkdir -p "public/js/components"
mkdir -p "public/css/components"

if [ -f "$JS_PATH" ]; then
    echo "Component already exists: $JS_PATH"
    exit 1
fi

cat > "$JS_PATH" << 'EOF'
// public/js/components/ComponentName.js

/**
 * ComponentName
 * Description: O que este componente faz.
 */
export class ComponentName {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.state = {};
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="nome-componente">
        <!-- Conteúdo do componente -->
      </div>
    `;
  }

  bindEvents() {
    // Adicionar event listeners aqui
  }

  update(newState) {
    Object.assign(this.state, newState);
    this.render();
    this.bindEvents();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
EOF

cat > "$CSS_PATH" << 'EOF'
/* public/css/components/nome-componente.css */

.nome-componente {
  /* Estilos do componente */
}

.nome-componente__element {
  /* BEM: elemento */
}

.nome-componente--modifier {
  /* BEM: modificador */
}
EOF

echo "Created component:"
echo "  JS:  $JS_PATH"
echo "  CSS: $CSS_PATH"
