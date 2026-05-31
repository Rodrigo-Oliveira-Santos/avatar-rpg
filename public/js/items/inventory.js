/**
 * Inventory System
 * Manages character inventory and equipment
 */

function getCharacterData(character) {
  return character.serialize();
}

function normalizeQuantity(quantity = 1) {
  const parsed = Number.parseInt(quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function mergeInventoryItem(inventory, item, quantity = 1) {
  const normalizedQuantity = normalizeQuantity(quantity);
  const existing = inventory.find(entry => entry.id === item.id);

  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity) + normalizedQuantity;
    return existing;
  }

  const nextItem = { ...item, quantity: normalizedQuantity };
  inventory.push(nextItem);
  return nextItem;
}

/**
 * Add item to inventory
 * @param {object} character - Character instance
 * @param {object} item - Item data
 * @returns {boolean} Success
 */
export function addItem(character, item) {
  const data = getCharacterData(character);
  if (!data.inventario) data.inventario = [];

  mergeInventoryItem(data.inventario, item, item.quantity || 1);
  character.load(data);
  return true;
}

/**
 * Remove item from inventory
 * @param {object} character - Character instance
 * @param {string} itemId - Item ID
 * @param {number} quantity - Quantity to remove
 * @returns {boolean} Success
 */
export function removeItem(character, itemId, quantity = 1) {
  const data = getCharacterData(character);
  const idx = data.inventario?.findIndex(i => i.id === itemId);

  if (idx == null || idx === -1) return false;

  const item = data.inventario[idx];
  const normalizedQuantity = normalizeQuantity(quantity);
  if (normalizeQuantity(item.quantity) <= normalizedQuantity) {
    data.inventario.splice(idx, 1);
  } else {
    item.quantity = normalizeQuantity(item.quantity) - normalizedQuantity;
  }

  character.load(data);
  return true;
}

/**
 * Equip item
 * @param {object} character - Character instance
 * @param {string} itemId - Item ID
 * @returns {object} { success, previousItem? }
 */
export function equipItem(character, itemId) {
  const data = getCharacterData(character);
  const itemIndex = data.inventario?.findIndex(i => i.id === itemId);

  if (itemIndex == null || itemIndex === -1) return { success: false, error: 'Item not found' };

  const item = data.inventario[itemIndex];
  const slot = getItemSlot(item.type);
  if (!slot) return { success: false, error: 'Invalid item type' };

  const previousItem = data.equipamentos?.[slot] || null;

  if (!data.equipamentos) data.equipamentos = {};
  if (!data.inventario) data.inventario = [];

  if (previousItem) {
    mergeInventoryItem(data.inventario, previousItem, previousItem.quantity || 1);
  }

  data.equipamentos[slot] = { ...item, quantity: 1 };

  if (normalizeQuantity(item.quantity) <= 1) {
    data.inventario.splice(itemIndex, 1);
  } else {
    data.inventario[itemIndex].quantity = normalizeQuantity(item.quantity) - 1;
  }

  character.load(data);
  return { success: true, previousItem };
}

/**
 * Unequip item
 * @param {object} character - Character instance
 * @param {string} slot - Equipment slot
 * @returns {object} { success, item? }
 */
export function unequipItem(character, slot) {
  const data = getCharacterData(character);
  const item = data.equipamentos?.[slot];

  if (!item) return { success: false, error: 'No item equipped' };

  if (!data.inventario) data.inventario = [];
  mergeInventoryItem(data.inventario, item, item.quantity || 1);

  data.equipamentos[slot] = null;
  character.load(data);

  return { success: true, item };
}

/**
 * Get item slot from type
 * @param {string} type - Item type
 * @returns {string|null} Slot name
 */
function getItemSlot(type) {
  const slots = {
    weapon: 'arma',
    armor: 'armadura',
    accessory: 'acessorio',
    shield: 'armadura',
    ring: 'acessorio',
    amulet: 'acessorio',
  };
  return slots[type] || null;
}

/**
 * Get all inventory items
 * @param {object} character - Character instance
 * @returns {array} Inventory items
 */
export function getInventory(character) {
  return character.getData().inventario || [];
}

/**
 * Get equipped items
 * @param {object} character - Character instance
 * @returns {object} Equipped items by slot
 */
export function getEquipped(character) {
  return character.getData().equipamentos || {};
}
