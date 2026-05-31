/**
 * Group Rewards Component
 * GM/Admin tool to distribute shared rewards across selected players.
 */

import { createElement, on } from '../utils/dom.js';
import { toast, confirmDialog } from '../utils/toast.js';
import { getPlayers, getPlayerUsernames } from './data.js';
import { log } from '../admin/LogService.js';
import { calculateXPForLevel, getMilestone } from '../character/xp.js';
import { GAME } from '../utils/constants.js';

const CHARACTER_STORAGE_PREFIX = 'avatar_rpg_character_';

function getCharacterStorageKey(username) {
  return `${CHARACTER_STORAGE_PREFIX}${username}`;
}

function parseCharacter(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureIdentity(character) {
  if (!character.identidade || typeof character.identidade !== 'object') {
    character.identidade = {};
  }

  const level = Math.max(1, Math.min(GAME.MAX_LEVEL, toNumber(character.identidade.nivel, 1)));

  character.identidade.nivel = level;
  character.identidade.xp_atual = Math.max(0, toNumber(character.identidade.xp_atual, 0));
  character.identidade.marco = character.identidade.marco || getMilestone(level);
  character.identidade.xp_proximo_nivel = toNumber(
    character.identidade.xp_proximo_nivel,
    calculateXPForLevel(level + 1)
  );

  if (!Number.isFinite(character.pontos_disponiveis)) {
    character.pontos_disponiveis = toNumber(character.pontos_disponiveis, 0);
  }
}

function addXPToCharacter(character, amount) {
  if (amount <= 0) return;

  ensureIdentity(character);
  character.identidade.xp_atual += amount;

  while (character.identidade.nivel < GAME.MAX_LEVEL) {
    const xpNeeded = calculateXPForLevel(character.identidade.nivel + 1);
    if (character.identidade.xp_atual < xpNeeded) break;

    character.identidade.xp_atual -= xpNeeded;
    character.identidade.nivel += 1;
    character.pontos_disponiveis = toNumber(character.pontos_disponiveis, 0) + GAME.POINTS_PER_LEVEL;
  }

  character.identidade.marco = getMilestone(character.identidade.nivel);
  character.identidade.xp_proximo_nivel = calculateXPForLevel(character.identidade.nivel + 1);
}

function getSelectablePlayers() {
  const usernames = getPlayerUsernames();
  const hubPlayers = getPlayers();

  return usernames.map(username => {
    const match = hubPlayers.find(player => {
      const rawId = typeof player?.id === 'string' ? player.id : '';
      const fromId = rawId.startsWith(CHARACTER_STORAGE_PREFIX)
        ? rawId.slice(CHARACTER_STORAGE_PREFIX.length)
        : null;

      return fromId === username || String(player?.name || '').toLowerCase() === username.toLowerCase();
    });

    return {
      username,
      name: match?.name || username,
      level: match?.level || null,
      element: match?.element || 'none',
    };
  });
}

export class GroupRewards {
  constructor(container, authManager) {
    this.container = container;
    this.authManager = authManager;
    this.selectedPlayers = new Set();
    this.players = [];
    this.goldInput = null;
    this.xpInput = null;
    this.previewEl = null;
    this.distributeBtn = null;
  }

  render() {
    if (!this.container) return;

    this.players = getSelectablePlayers();
    this.selectedPlayers.forEach(username => {
      if (!this.players.some(player => player.username === username)) {
        this.selectedPlayers.delete(username);
      }
    });

    this.container.innerHTML = '';

    const section = createElement('section', {
      style: 'margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);',
    });

    section.appendChild(createElement('div', {
      style: 'font-size: 12px; font-weight: 600; color: var(--gold); margin-bottom: 8px;',
      textContent: '💰 Recompensas em Grupo',
    }));

    const description = createElement('div', {
      style: 'font-size: 11px; color: var(--text2); margin-bottom: 10px; line-height: 1.4;',
      textContent: 'Divide o ouro total igualmente pelos jogadores selecionados e aplica XP opcional a cada um.',
    });
    section.appendChild(description);

    const inputGrid = createElement('div', {
      style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 10px;',
    });

    const goldField = this.createNumberField('Ouro total', 'Ex: 120', '1');
    this.goldInput = goldField.input;
    this.goldInput.min = '1';
    this.goldInput.value = '1';

    const xpField = this.createNumberField('XP por jogador', 'Ex: 50', '0');
    this.xpInput = xpField.input;
    this.xpInput.min = '0';
    this.xpInput.value = '0';

    inputGrid.appendChild(goldField.wrapper);
    inputGrid.appendChild(xpField.wrapper);
    section.appendChild(inputGrid);

    const toolsRow = createElement('div', {
      style: 'display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;',
    });

    const selectAllBtn = this.createActionButton('Selecionar Todos');
    on(selectAllBtn, 'click', () => this.setAllSelections(true));

    const clearBtn = this.createActionButton('Limpar');
    on(clearBtn, 'click', () => this.setAllSelections(false));

    toolsRow.appendChild(selectAllBtn);
    toolsRow.appendChild(clearBtn);
    section.appendChild(toolsRow);

    const playerList = createElement('div', {
      style: 'display: grid; gap: 6px; max-height: 200px; overflow-y: auto; padding-right: 4px; margin-bottom: 10px;',
    });

    if (this.players.length === 0) {
      playerList.appendChild(createElement('div', {
        style: 'padding: 10px 12px; border: 1px dashed var(--border2); border-radius: 6px; color: var(--text3); font-size: 11px;',
        textContent: 'Nenhum jogador com ficha guardada encontrado.',
      }));
    } else {
      this.players.forEach(player => {
        const label = createElement('label', {
          style: 'display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: rgba(255, 255, 255, 0.02); cursor: pointer;',
        });

        const checkbox = createElement('input', {
          type: 'checkbox',
          checked: this.selectedPlayers.has(player.username),
        });
        checkbox.dataset.username = player.username;
        checkbox.style.accentColor = 'var(--gold)';

        on(checkbox, 'change', () => {
          if (checkbox.checked) {
            this.selectedPlayers.add(player.username);
          } else {
            this.selectedPlayers.delete(player.username);
          }
          this.updatePreview();
        });

        const meta = createElement('div', { style: 'display: flex; flex-direction: column; gap: 2px;' });
        meta.appendChild(createElement('span', {
          style: 'font-size: 12px; color: var(--text); font-weight: 600;',
          textContent: player.name,
        }));

        const details = [];
        details.push(`@${player.username}`);
        if (player.level) details.push(`Nv. ${player.level}`);
        if (player.element && player.element !== 'none') details.push(player.element);

        meta.appendChild(createElement('span', {
          style: 'font-size: 10px; color: var(--text3); text-transform: capitalize;',
          textContent: details.join(' • '),
        }));

        label.appendChild(checkbox);
        label.appendChild(meta);
        playerList.appendChild(label);
      });
    }

    section.appendChild(playerList);

    const footer = createElement('div', {
      style: 'display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;',
    });

    this.previewEl = createElement('div', {
      style: 'font-size: 11px; color: var(--text2);',
      textContent: '0 ouro cada (0 jogadores selecionados)',
    });

    this.distributeBtn = createElement('button', {
      type: 'button',
      style: 'padding: 6px 14px; border-radius: 5px; border: 1px solid var(--gold); background: var(--gold); color: #111; cursor: pointer; font-size: 11px; font-weight: 700;',
      textContent: 'Distribuir',
      disabled: this.players.length === 0,
    });

    on(this.goldInput, 'input', () => this.updatePreview());
    on(this.xpInput, 'input', () => this.updatePreview());
    on(this.distributeBtn, 'click', async () => {
      await this.handleDistribute();
    });

    footer.appendChild(this.previewEl);
    footer.appendChild(this.distributeBtn);
    section.appendChild(footer);

    this.container.appendChild(section);
    this.updatePreview();
  }

  createNumberField(labelText, placeholder, minValue) {
    const wrapper = createElement('label', {
      style: 'display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--text2);',
    });

    const input = createElement('input', {
      type: 'number',
      placeholder,
      min: minValue,
      style: 'padding: 7px 9px; border-radius: 5px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 12px;',
    });

    wrapper.appendChild(createElement('span', { textContent: labelText }));
    wrapper.appendChild(input);

    return { wrapper, input };
  }

  createActionButton(label) {
    return createElement('button', {
      type: 'button',
      style: 'padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; font-size: 11px;',
      textContent: label,
    });
  }

  setAllSelections(checked) {
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"][data-username]');

    this.selectedPlayers.clear();
    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
      if (checked) {
        this.selectedPlayers.add(checkbox.dataset.username);
      }
    });

    this.updatePreview();
  }

  updatePreview() {
    if (!this.previewEl) return;

    const totalGold = Math.max(0, toNumber(this.goldInput?.value, 0));
    const selectedCount = this.selectedPlayers.size;
    const goldEach = selectedCount > 0 ? Math.floor(totalGold / selectedCount) : 0;

    this.previewEl.textContent = `${goldEach} ouro cada (${selectedCount} jogador${selectedCount !== 1 ? 'es' : ''} selecionado${selectedCount !== 1 ? 's' : ''})`;

    if (this.distributeBtn) {
      this.distributeBtn.disabled = selectedCount === 0 || totalGold < 1;
      this.distributeBtn.style.opacity = this.distributeBtn.disabled ? '0.6' : '1';
      this.distributeBtn.style.cursor = this.distributeBtn.disabled ? 'not-allowed' : 'pointer';
    }
  }

  async handleDistribute() {
    const totalGold = Number.parseInt(this.goldInput?.value || '', 10);
    const xpEach = Number.parseInt(this.xpInput?.value || '0', 10);
    const selectedPlayers = Array.from(this.selectedPlayers);

    if (!Number.isInteger(totalGold) || totalGold < 1) {
      toast('Indica um valor de ouro válido.', 'warning');
      return;
    }

    if (!Number.isInteger(xpEach) || xpEach < 0) {
      toast('Indica um valor de XP válido.', 'warning');
      return;
    }

    if (selectedPlayers.length === 0) {
      toast('Seleciona pelo menos um jogador.', 'warning');
      return;
    }

    const goldEach = Math.floor(totalGold / selectedPlayers.length);
    const confirmed = await confirmDialog(
      `Distribuir ${totalGold} ouro${xpEach > 0 ? ` (+ ${xpEach} XP)` : ''} por ${selectedPlayers.length} jogadores?`,
      { confirmText: 'Distribuir', cancelText: 'Cancelar' }
    );

    if (!confirmed) return;

    const updatedPlayers = [];

    selectedPlayers.forEach(username => {
      const storageKey = getCharacterStorageKey(username);
      const character = parseCharacter(localStorage.getItem(storageKey));
      if (!character) return;

      ensureIdentity(character);
      character.ouro = Math.max(0, toNumber(character.ouro, 0)) + goldEach;

      if (xpEach > 0) {
        addXPToCharacter(character, xpEach);
      }

      localStorage.setItem(storageKey, JSON.stringify(character));
      updatedPlayers.push(username);
    });

    if (updatedPlayers.length === 0) {
      toast('Não foi possível atualizar os jogadores selecionados.', 'error');
      return;
    }

    const actor = this.authManager?.getUser?.()?.username || 'gm';
    log('gm_reward', {
      type: 'group',
      gold_total: totalGold,
      gold_each: goldEach,
      xp_each: xpEach,
      players: updatedPlayers,
    }, actor);

    toast(`${totalGold} ouro distribuído por ${updatedPlayers.length} jogador${updatedPlayers.length !== 1 ? 'es' : ''}!`, 'success');

    this.container.dispatchEvent(new CustomEvent('group-rewards:updated', {
      bubbles: true,
      detail: {
        players: updatedPlayers,
        goldTotal: totalGold,
        goldEach,
        xpEach,
      },
    }));
  }
}
