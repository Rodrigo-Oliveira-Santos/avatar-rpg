/**
 * Helper UI partilhado para painéis admin: confirma com o utilizador
 * que pretende apagar uma conta e mostra um resumo do que foi
 * removido (ficha Avatar, ficha D&D, builds MC, ...).
 *
 * Os painéis (Landing/Avatar/D&D/MC) chamam isto para evitar duplicar
 * o fluxo de confirmação dupla e o feedback.
 */

import { toast, confirmDialog } from '../../utils/toast.js';
import { deleteUser, validateDeleteUser } from './users-registry.js';

/**
 * Pede confirmação e apaga a conta. Devolve `true` se a remoção
 * efectivamente correu (UI deve refrescar), `false` caso contrário
 * (cancelamento ou validação falhada).
 */
export async function confirmAndDeleteUser({ username, actor, onDone } = {}) {
  if (!username) return false;

  const validation = validateDeleteUser({ username, actor });
  if (!validation.allowed) {
    toast(validation.reason, 'warning');
    return false;
  }

  const ok = await confirmDialog(
    `Apagar a conta de "${username}" e TODOS os dados associados ` +
    '(ficha Avatar, ficha D&D, builds Minecraft, reações, listas, ' +
    'sessão activa)?\n\nEsta acção é irreversível.',
    { confirmText: 'Apagar conta', cancelText: 'Cancelar' },
  );
  if (!ok) return false;

  // Confirmação dupla — operação destrutiva
  const sure = await confirmDialog(
    `Tens a CERTEZA que queres apagar "${username}"? Não há volta atrás.`,
    { confirmText: 'Sim, apagar', cancelText: 'Cancelar' },
  );
  if (!sure) return false;

  const res = await deleteUser(username, { actor });
  if (!res.ok) {
    toast(res.reason || 'Falha ao apagar conta.', 'error');
    return false;
  }

  toast(buildSummary(username, res.removed), 'success', 5000);
  onDone?.(res);
  return true;
}

function buildSummary(username, r) {
  const parts = [];
  if (r.registry) parts.push('registry');
  if (r.avatarCharacter) parts.push('ficha Avatar');
  if (r.dndCharacter) parts.push('ficha D&D');
  if (r.mcBuilds) parts.push(`${r.mcBuilds} build${r.mcBuilds === 1 ? '' : 's'} MC`);
  if (r.mcReactions) parts.push(`${r.mcReactions} reaç${r.mcReactions === 1 ? 'ão' : 'ões'}`);
  if (r.mcLists) parts.push('listas MC');
  if (r.sessions) parts.push(`${r.sessions} sessã${r.sessions === 1 ? 'o' : 'ões'}`);
  if (!parts.length) return `Conta "${username}" removida (sem dados associados).`;
  return `Conta "${username}" removida: ${parts.join(', ')}.`;
}
