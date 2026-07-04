/**
 * Detectores de plataformas para os links sociais opcionais das builds.
 *
 * Devolve um descritor `{ platform, label, icon, url }` ou `null`.
 * Suportamos:
 *   • YouTube      → 'youtube'    (vídeo da build)
 *   • Instagram    → 'instagram'  (post / reel)
 *   • Outro https  → 'link'       (fallback genérico — só se for URL válida)
 */

const ICONS = {
  youtube:   '▶',  // simples e seguro (sem dependências de fonts)
  instagram: '📷',
  link:      '🔗',
};

const LABELS = {
  youtube:   'YouTube',
  instagram: 'Instagram',
  link:      'Link externo',
};

function isUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectPlatform(input) {
  if (!input) return null;
  const url = String(input).trim();
  if (!isUrl(url)) return null;
  const host = new URL(url).hostname.toLowerCase();

  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    return { platform: 'youtube', label: LABELS.youtube, icon: ICONS.youtube, url };
  }
  if (host.endsWith('instagram.com')) {
    return { platform: 'instagram', label: LABELS.instagram, icon: ICONS.instagram, url };
  }
  return { platform: 'link', label: LABELS.link, icon: ICONS.link, url };
}
