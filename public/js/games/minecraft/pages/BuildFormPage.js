/**
 * Minecraft — formulário de criação/edição de build.
 *
 * Inputs:
 *  • Título
 *  • Descrição (multi-linha)
 *  • Categoria (select)
 *  • Versão MC (opcional)
 *  • Link Drive da thumbnail
 *  • Link Drive do ficheiro de download
 *
 * Faz pré-visualização ao vivo da thumbnail; converte automaticamente
 * os links Drive para os respetivos endpoints diretos. A app **não**
 * guarda a imagem — apenas o link Drive.
 */

import { createElement, on } from '../../../utils/dom.js';
import { CATEGORIES } from '../../../api/mc-builds.js';
import { driveThumbnailUrl, extractDriveId, probeDriveImage } from '../lib/drive.js';
import { detectPlatform } from '../lib/social.js';
import { toast } from '../../../utils/toast.js';

export function renderBuildForm(initial, { onSubmit, onCancel, isEdit = false }) {
  const data = {
    title: '',
    description: '',
    category: 'survival',
    mc_version: '',
    tags: [],
    thumbnail_drive: '',
    download_drive: '',
    video_url: '',
    social_url: '',
    ...(initial || {}),
  };
  // Normalizar tags se vierem como string
  if (typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const form = createElement('form', { class: 'mc-form' });
  form.appendChild(createElement('h2', { textContent: isEdit ? 'Editar Build' : 'Nova Build' }));

  const grid = createElement('div', { class: 'mc-form-grid' });

  grid.appendChild(textField('Título', data.title, (v) => { data.title = v; }, true));
  grid.appendChild(selectField('Categoria', data.category, CATEGORIES.map((c) => [c.id, c.label]),
    (v) => { data.category = v; }));
  grid.appendChild(textField('Versão MC (opcional)', data.mc_version, (v) => { data.mc_version = v; }));

  form.appendChild(grid);

  const fullGrid = createElement('div', { class: 'mc-form-grid full', style: 'margin-top:10px' });

  // Description
  fullGrid.appendChild(textareaField('Descrição', data.description, (v) => { data.description = v; }));

  // Tags
  const tagsField = createElement('div', { class: 'field' });
  tagsField.appendChild(createElement('label', { textContent: 'Tags (separadas por vírgula)' }));
  const tagsInput = createElement('input', {
    type: 'text',
    value: data.tags.join(', '),
    placeholder: 'ex: medieval, castelo, automatic, glass',
  });
  on(tagsInput, 'input', () => {
    data.tags = tagsInput.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  });
  tagsField.appendChild(tagsInput);
  tagsField.appendChild(createElement('div', {
    class: 'help',
    textContent: 'Até 20 tags. Use letras minúsculas para consistência. Aparecem como filtro na galeria.',
  }));
  fullGrid.appendChild(tagsField);

  // Thumb Drive — com validação assíncrona
  const thumbField = createElement('div', { class: 'field' });
  thumbField.appendChild(createElement('label', { textContent: 'Link Drive — Thumbnail' }));
  const thumbInput = createElement('input', {
    type: 'text',
    value: data.thumbnail_drive,
    placeholder: 'https://drive.google.com/file/d/<ID>/view',
  });
  thumbField.appendChild(thumbInput);
  const thumbStatus = createElement('div', { class: 'help', style: 'min-height:14px' });
  thumbField.appendChild(thumbStatus);
  const thumbPreview = createElement('div', { class: 'mc-preview-thumb' });
  thumbField.appendChild(thumbPreview);

  let lastProbeId = 0;
  const refreshPreview = () => {
    thumbPreview.innerHTML = '';
    const url = driveThumbnailUrl(thumbInput.value, 600);
    const id = extractDriveId(thumbInput.value);
    if (!id) {
      thumbPreview.style.display = 'flex';
      thumbPreview.style.alignItems = 'center';
      thumbPreview.style.justifyContent = 'center';
      thumbPreview.style.color = 'var(--text3,#777)';
      thumbPreview.style.fontSize = '11px';
      thumbPreview.textContent = thumbInput.value ? 'Link inválido' : '(pré-visualização)';
      thumbStatus.textContent = thumbInput.value ? '⚠ Link Drive não detectado.' : '';
      thumbStatus.style.color = thumbInput.value ? '#eab308' : '';
      return;
    }
    const img = createElement('img', { alt: 'preview', src: url });
    img.onerror = () => {
      thumbPreview.innerHTML = '';
      thumbPreview.style.color = 'var(--text3,#777)';
      thumbPreview.style.fontSize = '11px';
      thumbPreview.style.display = 'flex';
      thumbPreview.style.alignItems = 'center';
      thumbPreview.style.justifyContent = 'center';
      thumbPreview.textContent = 'Não foi possível carregar (Drive não público?)';
    };
    thumbPreview.appendChild(img);

    // Validação assíncrona — apenas o último probe conta
    const myProbe = ++lastProbeId;
    thumbStatus.textContent = '⏳ A validar link…';
    thumbStatus.style.color = 'var(--text2,#aaa)';
    probeDriveImage(thumbInput.value).then((res) => {
      if (myProbe !== lastProbeId) return;
      if (res.ok) {
        thumbStatus.textContent = '✓ Link Drive público e acessível.';
        thumbStatus.style.color = '#22c55e';
      } else {
        thumbStatus.textContent = `✕ ${res.reason}`;
        thumbStatus.style.color = '#ef4444';
      }
    });
  };

  on(thumbInput, 'input', () => { data.thumbnail_drive = thumbInput.value; refreshPreview(); });
  refreshPreview();
  fullGrid.appendChild(thumbField);

  // Download Drive — com validação assíncrona (mesmo princípio mas sem preview de imagem)
  const dlField = createElement('div', { class: 'field' });
  dlField.appendChild(createElement('label', { textContent: 'Link Drive — Ficheiro (.schematic, .litematic, .zip, …)' }));
  const dlInput = createElement('input', {
    type: 'text',
    value: data.download_drive,
    placeholder: 'https://drive.google.com/file/d/<ID>/view',
  });
  on(dlInput, 'input', () => {
    data.download_drive = dlInput.value;
    const id = extractDriveId(dlInput.value);
    if (!dlInput.value) {
      dlStatus.textContent = '';
    } else if (!id) {
      dlStatus.textContent = '⚠ Link Drive não detectado.';
      dlStatus.style.color = '#eab308';
    } else {
      dlStatus.textContent = '✓ ID Drive válido. (Privacidade do ficheiro não pode ser testada — garante "qualquer pessoa com o link".)';
      dlStatus.style.color = '#22c55e';
    }
  });
  dlField.appendChild(dlInput);
  const dlStatus = createElement('div', { class: 'help', style: 'min-height:14px' });
  dlField.appendChild(dlStatus);
  fullGrid.appendChild(dlField);

  // Video URL (YouTube)
  const videoField = createElement('div', { class: 'field' });
  videoField.appendChild(createElement('label', { textContent: 'Link YouTube do vídeo (opcional)' }));
  const videoInput = createElement('input', { type: 'text', value: data.video_url, placeholder: 'https://youtu.be/…' });
  const videoStatus = createElement('div', { class: 'help', style: 'min-height:14px' });
  on(videoInput, 'input', () => {
    data.video_url = videoInput.value;
    const det = detectPlatform(videoInput.value);
    if (!videoInput.value) {
      videoStatus.textContent = '';
    } else if (det?.platform === 'youtube') {
      videoStatus.textContent = '✓ Link YouTube detectado.';
      videoStatus.style.color = '#22c55e';
    } else if (det) {
      videoStatus.textContent = `⚠ URL válido mas não parece YouTube (será mostrado como link genérico).`;
      videoStatus.style.color = '#eab308';
    } else {
      videoStatus.textContent = '✕ URL inválido.';
      videoStatus.style.color = '#ef4444';
    }
  });
  videoField.appendChild(videoInput);
  videoField.appendChild(videoStatus);
  fullGrid.appendChild(videoField);

  // Social URL (Instagram / outro)
  const socialField = createElement('div', { class: 'field' });
  socialField.appendChild(createElement('label', { textContent: 'Link Instagram / outro (opcional)' }));
  const socialInput = createElement('input', { type: 'text', value: data.social_url, placeholder: 'https://instagram.com/p/…' });
  const socialStatus = createElement('div', { class: 'help', style: 'min-height:14px' });
  on(socialInput, 'input', () => {
    data.social_url = socialInput.value;
    const det = detectPlatform(socialInput.value);
    if (!socialInput.value) {
      socialStatus.textContent = '';
    } else if (det) {
      socialStatus.textContent = `✓ ${det.label} detectado.`;
      socialStatus.style.color = '#22c55e';
    } else {
      socialStatus.textContent = '✕ URL inválido.';
      socialStatus.style.color = '#ef4444';
    }
  });
  socialField.appendChild(socialInput);
  socialField.appendChild(socialStatus);
  fullGrid.appendChild(socialField);

  form.appendChild(fullGrid);

  // Actions
  const actions = createElement('div', { class: 'mc-form-actions' });
  const cancel = createElement('button', { class: 'mc-btn', type: 'button', textContent: 'Cancelar' });
  on(cancel, 'click', () => onCancel?.());
  const submit = createElement('button', { class: 'mc-btn primary', type: 'submit', textContent: isEdit ? 'Guardar' : 'Adicionar' });
  actions.appendChild(cancel);
  actions.appendChild(submit);
  form.appendChild(actions);

  on(form, 'submit', (e) => {
    e.preventDefault();
    if (!data.title.trim()) { toast('Título é obrigatório', 'warning'); return; }
    if (!data.download_drive.trim()) { toast('Link de download em falta', 'warning'); return; }
    if (!extractDriveId(data.download_drive)) {
      toast('Link de download não parece ser do Google Drive', 'warning');
      return;
    }
    onSubmit?.({ ...data });
  });

  return form;
}

// ─── Helpers de campos ────────────────────────────────────────────

function textField(label, value, onChange, required) {
  const wrap = createElement('div', { class: 'field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const input = createElement('input', { type: 'text', value: value || '' });
  if (required) input.required = true;
  on(input, 'input', () => onChange(input.value));
  wrap.appendChild(input);
  return wrap;
}

function textareaField(label, value, onChange) {
  const wrap = createElement('div', { class: 'field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const ta = createElement('textarea', { rows: 4 });
  ta.value = value || '';
  on(ta, 'input', () => onChange(ta.value));
  wrap.appendChild(ta);
  return wrap;
}

function selectField(label, value, options, onChange) {
  const wrap = createElement('div', { class: 'field' });
  wrap.appendChild(createElement('label', { textContent: label }));
  const sel = createElement('select');
  options.forEach(([v, lbl]) => {
    const o = createElement('option', { value: v, textContent: lbl });
    if (v === value) o.selected = true;
    sel.appendChild(o);
  });
  on(sel, 'change', () => onChange(sel.value));
  wrap.appendChild(sel);
  return wrap;
}
