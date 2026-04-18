/**
 * Inventory System
 * Manages character inventory and equipment
 */

/**
 * Add item to inventory
 * @param {object} character - Character instance
 * @param {object} item - Item data
 * @returns {boolean} Success
 */
export function addItem(character, item) {
  const data = character.getData();
  if (!data.inventario) data.inventario = [];

  // Check if item already exists (stackable?)
  const existing = data.inventario.find(i => i.id === item.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    data.inventario.push({ ...item, quantity: 1 });
  }

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
  const data = character.getData();
  const idx = data.inventario?.findIndex(i => i.id === itemId);

  if (idx === -1) return false;

  const item = data.inventario[idx];
  if ((item.quantity || 1) <= quantity) {
    data.inventario.splice(idx, 1);
  } else {
    item.quantity -= quantity;
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
  const data = character.getData();
  const item = data.inventario?.find(i => i.id === itemId);

  if (!item) return { success: false, error: 'Item not found' };

  // Determine slot
  const slot = getItemSlot(item.type);
  if (!slot) return { success: false, error: 'Invalid item type' };

  const previousItem = data.equipamentos?.[slot] || null;

  // Equip new item
  if (!data.equipamentos) data.equipamentos = {};
  data.equipamentos[slot] = { ...item };

  // Remove from inventory (or decrement quantity)
  removeItem(character, itemId, 1);

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
  const data = character.getData();
  const item = data.equipamentos?.[slot];

  if (!item) return { success: false, error: 'No item equipped' };

  // Add back to inventory
  if (!data.inventario) data.inventario = [];
  data.inventario.push(item);

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
