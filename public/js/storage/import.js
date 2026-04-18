/**
 * Character Import System
 * Import and validate character JSON files
 */

import { validateCharacterSchema } from '../utils/validators.js';

/**
 * Import character from JSON file input
 * @param {HTMLInputElement} fileInput - File input element
 * @returns {Promise<object>} Character data
 */
export async function importFromInput(fileInput) {
  const file = fileInput.files?.[0];
  if (!file) {
    throw new Error('No file selected');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const result = validateImport(data);
        if (result.valid) {
          resolve(result.character);
        } else {
          reject(new Error(result.errors.join(', ')));
        }
      } catch (err) {
        reject(new Error(`Invalid JSON: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import character from JSON string
 * @param {string} jsonString - JSON string
 * @returns {object} { valid, character?, errors? }
 */
export function importFromString(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return validateImport(data);
  } catch (err) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${err.message}`],
    };
  }
}

/**
 * Validate imported data structure
 * @param {object} data - Parsed JSON data
 * @returns {object} { valid, character?, errors? }
 */
function validateImport(data) {
  const errors = [];

  // Check for meta (optional but expected)
  if (!data.meta) {
    console.warn('Import: Missing meta field');
  }

  // Check for character data
  let character = data.character || data;

  // Validate character schema
  const validation = validateCharacterSchema(character);
  if (!validation.valid) {
    errors.push(...validation.errors);
  }

  // Check for required fields
  if (!character.identidade) {
    errors.push('Missing identidade (identity) field');
  } else {
    if (!character.identidade.nome) {
      errors.push('Missing character name');
    }
    if (!character.identidade.elemento) {
      errors.push('Missing character element');
    }
  }

  if (!character.atributos) {
    errors.push('Missing atributos (attributes) field');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    character,
  };
}

/**
 * Create file input for import (programmatic)
 * @param {Function} callback - Callback with character data
 * @returns {HTMLInputElement} File input element
 */
export function createFileInput(callback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';

  input.addEventListener('change', async () => {
    try {
      const character = await importFromInput(input);
      callback(null, character);
    } catch (err) {
      callback(err, null);
    }
    // Cleanup
    input.remove();
  });

  document.body.appendChild(input);
  input.click();

  return input;
}
