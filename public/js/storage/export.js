/**
 * Character Export System
 * Export character data as JSON file
 */

import { validateCharacterSchema } from '../utils/validators.js';

/**
 * Export character to JSON file
 * @param {object} characterData - Character data
 * @param {string} filename - Output filename
 */
export function exportToJSON(characterData, filename = null) {
  const data = {
    meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      game: 'Avatar RPG',
    },
    character: characterData,
  };

  // Validate before export
  const validation = validateCharacterSchema(data);
  if (!validation.valid) {
    console.warn('Export validation warnings:', validation.errors);
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${characterData.identidade?.nome || 'character'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('[Export] Character exported');
}

/**
 * Export character as string (for clipboard)
 * @param {object} characterData - Character data
 * @returns {string} JSON string
 */
export function exportToString(characterData) {
  return JSON.stringify({
    meta: {
      version: '1.0',
      exported_at: new Date().toISOString(),
    },
    character: characterData,
  }, null, 2);
}

/**
 * Copy character to clipboard
 * @param {object} characterData - Character data
 * @returns {Promise<boolean>} Success
 */
export async function copyToClipboard(characterData) {
  try {
    const json = exportToString(characterData);
    await navigator.clipboard.writeText(json);
    console.log('[Export] Copied to clipboard');
    return true;
  } catch (err) {
    console.error('[Export] Clipboard failed', err);
    return false;
  }
}
