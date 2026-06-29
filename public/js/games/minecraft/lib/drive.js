/**
 * Helpers para converter URLs do Google Drive em URLs diretos de
 * visualização (thumbnails) e de download.
 *
 * Formatos suportados de partilha (input):
 *   • https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   • https://drive.google.com/file/d/<ID>/preview
 *   • https://drive.google.com/open?id=<ID>
 *   • https://drive.google.com/uc?id=<ID>&...
 *   • Apenas o ID puro
 */

const FILE_PATH_RE = /\/file\/d\/([A-Za-z0-9_-]+)/;
const QUERY_ID_RE = /[?&]id=([A-Za-z0-9_-]+)/;

export function extractDriveId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // ID puro (sem URL)
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return s;

  let m = s.match(FILE_PATH_RE);
  if (m) return m[1];

  m = s.match(QUERY_ID_RE);
  if (m) return m[1];

  return null;
}

export function driveViewUrl(input) {
  const id = extractDriveId(input);
  return id ? `https://drive.google.com/uc?export=view&id=${id}` : null;
}

/**
 * `lh3.googleusercontent.com` é mais fiável para hotlinking de imagens do
 * Drive — `uc?export=view` por vezes redireciona para uma página HTML.
 * Devolve sempre uma URL "thumbnail" que serve para src de <img>.
 */
export function driveThumbnailUrl(input, size = 1000) {
  const id = extractDriveId(input);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${size}`;
}

export function driveDownloadUrl(input) {
  const id = extractDriveId(input);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : null;
}

/** Valida que o link parece ser do Drive (heurístico). */
export function isLikelyDriveUrl(input) {
  if (!input) return false;
  return /drive\.google\.com/.test(String(input)) || /^[A-Za-z0-9_-]{20,}$/.test(String(input).trim());
}

/**
 * Tenta carregar a thumbnail Drive e devolve uma Promise<{ok, reason}>.
 * Usa um <img> com timeout — `fetch` falhava por CORS para a maioria
 * dos URLs do Drive, pelo que o teste mais fiável é deixar o browser
 * carregar a imagem. Resolve com:
 *   • { ok: true } se a imagem carrega.
 *   • { ok: false, reason } se falha ou expira.
 */
export function probeDriveImage(input, { timeoutMs = 6000 } = {}) {
  return new Promise((resolve) => {
    const id = extractDriveId(input);
    if (!id) return resolve({ ok: false, reason: 'Sem ID Drive válido.' });
    const url = `https://drive.google.com/thumbnail?id=${id}&sz=w400`;
    const img = new Image();
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      img.onload = img.onerror = null;
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ok: false, reason: 'Timeout — verifica se o link está partilhado publicamente.' }), timeoutMs);
    img.onload = () => {
      // Imagens 0×0 indicam Drive negou (página HTML em vez de imagem)
      if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
        finish({ ok: false, reason: 'Drive devolveu placeholder — o link pode não estar público.' });
      } else {
        finish({ ok: true });
      }
    };
    img.onerror = () => finish({ ok: false, reason: 'Falha ao carregar a imagem (link privado, removido ou não é imagem).' });
    img.src = url;
  });
}
