import { parseRatio, drawGrid, gapPx, cellWidthForTotal } from './grid.js';

// Cada celda se exportará a 1080x1440 (3:4), así que trabajamos con fotos de 1440 de alto
const WORK_HEIGHT = 1440;
const PREVIEW_WIDTH = 600;

const $ = (id) => document.getElementById(id);
const fileInput = $('file-input');
const thumbs = $('thumbs');
const photoCount = $('photo-count');
const canvas = $('canvas');
const controls = ['cols', 'rows', 'ratio', 'fit', 'gap', 'bg'].map($);

/** @type {ImageBitmap[]} */
const photos = [];

/* ---------- Carga de fotos ---------- */

fileInput.addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    try {
      const bitmap = await createImageBitmap(file, {
        resizeHeight: WORK_HEIGHT,
        resizeQuality: 'medium',
      });
      photos.push(bitmap);
      addThumb(bitmap);
      updateCount();
      scheduleRender();
    } catch (err) {
      console.warn('No se pudo leer', file.name, err);
    }
  }
  fileInput.value = '';
});

function addThumb(bitmap) {
  const c = document.createElement('canvas');
  c.width = 90;
  c.height = 120;
  const ctx = c.getContext('2d');
  const scale = Math.max(c.width / bitmap.width, c.height / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (c.width - w) / 2, (c.height - h) / 2, w, h);
  thumbs.appendChild(c);
}

function updateCount() {
  const n = photos.length;
  const slots = Number($('cols').value) * Number($('rows').value);
  let text = `${n} foto${n === 1 ? '' : 's'} cargada${n === 1 ? '' : 's'}`;
  if (n > slots) text += ` · la grilla muestra las primeras ${slots}`;
  photoCount.textContent = n ? text : 'Todavía no elegiste fotos';
}

/* ---------- Vista previa ---------- */

export function readSettings() {
  return {
    cols: Number($('cols').value),
    rows: Number($('rows').value),
    ratio: parseRatio($('ratio').value),
    fit: $('fit').value,
    gapUnits: Number($('gap').value),
    bg: $('bg').value,
  };
}

let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function renderPreview() {
  const s = readSettings();
  const cellW = cellWidthForTotal(PREVIEW_WIDTH, s.cols, s.gapUnits);
  drawGrid(canvas, {
    photos,
    cols: s.cols,
    rows: s.rows,
    ratio: s.ratio,
    fit: s.fit,
    bg: s.bg,
    cellW,
    gap: gapPx(s.gapUnits, cellW),
    placeholders: true,
  });
}

controls.forEach((el) =>
  el.addEventListener('input', () => {
    updateCount();
    scheduleRender();
  })
);

renderPreview();
