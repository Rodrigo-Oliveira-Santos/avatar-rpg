/**
 * Helper UI partilhado para painéis admin: confirma com o utilizador
 * que pretende apagar uma conta e mostra um resumo do que foi
 * removido.
 *
 * Cada painel passa o seu próprio `app` para que a operação fique
 * confinada a essa app (Avatar / D&D / MC) — contas independentes
 * desde 2026-06-30. O painel cross-app da landing pode passar
 * `app: 'all'` para cascatar pelas três.
 */

import { toast, confirmDialog } from '../../utils/toast.js';
import {
  deleteUser,
  validateAppDeleteUser,
  APP_LABELS,
} from './users-registry.js';

const DEFAULT_APP = 'avatar';

const APP_DATA_DESCRIPTIONS = {
  avatar: 'ficha Avatar + trades + sessão',
  dnd: 'ficha D&D + sessão',
  mc: 'builds + reações + listas + sessão',
  all: 'TUDO: ficha Avatar, ficha D&D, builds Minecraft, reações, listas, sessões',
};

/**
 * Pede confirmação (dupla) e apaga a conta na app indicada. Devolve
 * `true` se a remoção efectivamente correu, `false` caso contrário
 * (cancelamento ou validação falhada).
 *
 * @param {object} opts
 * @param {string} opts.username
 * @param {object} opts.actor      — Sessão a executar a acção.
 * @param {string} [opts.app='avatar']
 *   — 'avatar' | 'dnd' | 'mc' | 'all'. Padrão Avatar, para o caso de
 *   call-sites legacy que ainda não passem o argumento.
 * @param {Function} [opts.onDone] — Callback no sucesso.
 */
export async function confirmAndDeleteUser({ username, actor, app = DEFAULT_APP, onDone } = {}) {
  if (!username) return false;

  // Validate against the targeted app's invariants. For `all` we
  // validate every app — `deleteUser(..., { app: 'all' })` also does
  // this, but doing it upfront here means the cancel-friendly
  // confirmation dialog never appears for an invalid request.
  if (app !== 'all') {
    const validation = validateAppDeleteUser({ appId: app, username, actor });
    if (!validation.allowed) {
      toast(validation.reason, 'warning');
      return false;
    }
  }

  const appLabel = APP_LABELS[app] || (app === 'all' ? 'TODAS as apps' : 'app desconhecida');
  const dataDesc = APP_DATA_DESCRIPTIONS[app] || 'dados associados';

  const ok = await confirmDialog(
    `Apagar a conta de "${username}" em ${appLabel}?\n` +
    `Isto remove: ${dataDesc}.\n\n` +
    'Esta acção é irreversível.',
    { confirmText: 'Apagar conta', cancelText: 'Cancelar' },
  );
  if (!ok) return false;

  // Confirmação dupla — operação destrutiva. Mantida em TODOS os pontos
  // de delete para que o admin não apague por engano.
  const sure = await confirmDialog(
    `Tens a CERTEZA que queres apagar "${username}" em ${appLabel}? Não há volta atrás.`,
    { confirmText: 'Sim, apagar', cancelText: 'Cancelar' },
  );
  if (!sure) return false;

  const res = await deleteUser(username, { actor, app });
  if (!res.ok) {
    toast(res.reason || 'Falha ao apagar conta.', 'error');
    return false;
  }

  toast(buildSummary(username, app, res.removed), 'success', 5000);
  onDone?.(res);
  return true;
}

/**
 * Build a one-line summary of what got removed across one or more
 * apps. The new `removed` shape is grouped per-app (avatar / dnd /
 * mc) so the summary lists each app section that actually ran.
 */
function buildSummary(username, app, removed) {
  if (!removed || typeof removed !== 'object') {
    return `Conta "${username}" removida.`;
  }
  const sections = [];
  const seen = new Set();

  function pushAvatar(r) {
    if (!r || seen.has('avatar')) return;
    seen.add('avatar');
    const parts = [];
    if (r.registry) parts.push('registry');
    if (r.avatarCharacter) parts.push('ficha');
    if (r.avatarTradesCleaned) parts.push(`${r.avatarTradesCleaned} trade(s)`);
    if (r.session) parts.push('sessão');
    if (parts.length) sections.push(`Avatar [${parts.join(', ')}]`);
  }

  function pushDnd(r) {
    if (!r || seen.has('dnd')) return;
    seen.add('dnd');
    const parts = [];
    if (r.registry) parts.push('registry');
    if (r.dndCharacter) parts.push('ficha');
    if (r.session) parts.push('sessão');
    if (parts.length) sections.push(`D&D [${parts.join(', ')}]`);
  }

  function pushMc(r) {
    if (!r || seen.has('mc')) return;
    seen.add('mc');
    const parts = [];
    if (r.registry) parts.push('registry');
    if (r.mcBuilds) parts.push(`${r.mcBuilds} build(s)`);
    if (r.mcReactions) parts.push(`${r.mcReactions} reação/ões`);
    if (r.mcLists) parts.push('listas');
    if (r.session) parts.push('sessão');
    if (parts.length) sections.push(`Minecraft [${parts.join(', ')}]`);
  }

  pushAvatar(removed.avatar);
  pushDnd(removed.dnd);
  pushMc(removed.mc);

  if (!sections.length) return `Conta "${username}" removida (sem dados associados).`;
  return `Conta "${username}" removida: ${sections.join(' · ')}.`;
}
