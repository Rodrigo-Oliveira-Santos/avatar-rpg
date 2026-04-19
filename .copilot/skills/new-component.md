# Skill: New Component

Cria um novo componente frontend para o Avatar RPG.

A stack é **HTML/CSS/JS vanilla** (ES6+) — sem frameworks.

## Estrutura de um Componente

Cada componente é composto por 3 ficheiros:

```
public/
├── css/components/NomeComponente.css   # Estilos escopados
└── js/NomeComponente.js                # Lógica do componente
```

O HTML é injetado via JS ou adicionado diretamente em `public/index.html`.

## Template — JavaScript

```javascript
// public/js/components/NomeComponente.js

/**
 * NomeComponente
 * Descrição: O que este componente faz.
 */
export class NomeComponente {
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
```

## Template — CSS

```css
/* public/css/components/NomeComponente.css */

.nome-componente {
  /* Estilos do componente */
}

.nome-componente__header {
  /* BEM: elemento */
}

.nome-componente--active {
  /* BEM: modificador */
}
```

## Como Usar

### 1. Criar os ficheiros manualmente

Criar `public/js/components/NomeComponente.js` e `public/css/components/NomeComponente.css` com os templates acima.

### 2. Importar no `app.js`

```javascript
import { NomeComponente } from './components/NomeComponente.js';
```

### 3. Adicionar CSS em `index.html`

```html
<link rel="stylesheet" href="css/components/NomeComponente.css">
```

## Convenções

- Nomes em PascalCase para ficheiros JS (`SkillCard.js`)
- Nomes em kebab-case para ficheiros CSS (`skill-card.css`)
- Classes CSS em BEM (`.bloco__elemento--modificador`)
- Métodos públicos: `render()`, `update()`, `destroy()`
- Estado interno em `this.state`
- Sem dependências externas — apenas Web APIs nativas

## Exemplos Existentes

Ver ficheiros em `public/js/skills/` e `public/js/character/` para referência de padrões existentes no projeto.
