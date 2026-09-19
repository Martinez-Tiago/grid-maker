import { parseRatio, drawGrid, gapPx, cellWidthForTotal } from './grid.js';
import { renderGridBlob, fileName, downloadBlob, shareSupported, sleep } from './share.js';

const WORK_HEIGHT = 1440;
const PREVIEW_WIDTH = 600;

const $ = (id) => document.getElementById(id);
const fileInput = $('file-input');
const thumbs = $('thumbs');
const photoCount = $('photo-count');
const canvas = $('canvas');
const pager = $('pager');
const pageLabel = $('page-label');
const btnDownload = $('btn-download');
const btnShare = $('btn-share');
const statusEl = $('status');
const controls = ['cols', 'rows', 'ratio', 'fit', 'gap', 'bg', 'format'].map($);

/** @type {ImageBitmap[]} */
const photos = [];
let currentPage = 0;
let busy = false;
let pendingShare = null; // archivos ya generados, a la espera de un nuevo toque

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
      onChange();
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

/* ---------- Configuración y páginas ---------- */

function readSettings() {
  return {
    cols: Number($('cols').value),
    rows: Number($('rows').value),
    ratio: parseRatio($('ratio').value),
    fit: $('fit').value,
    gapUnits: Number($('gap').value),
    bg: $('bg').value,
  };
}

const slots = (s) => s.cols * s.rows;
const pageCount = (s) => Math.max(1, Math.ceil(photos.length / slots(s)));
const pagePhotos = (s, i) => photos.slice(i * slots(s), (i + 1) * slots(s));

function setStatus(msg) {
  statusEl.textContent = msg;
}

/* ---------- Interfaz ---------- */

let renderQueued = false;
function onChange() {
  pendingShare = null; // cualquier cambio invalida los archivos ya generados
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    updateUI();
  });
}

function updateUI() {
  const s = readSettings();
  const pages = pageCount(s);
  currentPage = Math.min(currentPage, pages - 1);

  // Contador
  const n = photos.length;
  if (!n) {
    photoCount.textContent = 'Todavía no elegiste fotos';
  } else {
    photoCount.textContent =
      `${n} foto${n === 1 ? '' : 's'} · ${pages} grilla${pages === 1 ? '' : 's'}`;
  }

  // Paginador
  pager.hidden = pages <= 1;
  pageLabel.textContent = `Grilla ${currentPage + 1} de ${pages}`;
  $('prev').disabled = currentPage === 0;
  $('next').disabled = currentPage >= pages - 1;

  // Botones
  const label = pages > 1 ? ` (${pages} grillas)` : '';
  btnDownload.textContent = `Descargar${label}`;
  btnShare.textContent = `Compartir${label}`;
  btnDownload.disabled = busy || !n;
  btnShare.disabled = busy || !n || !shareSupported();
  btnShare.title = shareSupported() ? '' : 'Este navegador no permite compartir archivos (necesita HTTPS)';

  renderPreview(s);
}

function renderPreview(s) {
  const cellW = cellWidthForTotal(PREVIEW_WIDTH, s.cols, s.gapUnits);
  drawGrid(canvas, {
    photos: pagePhotos(s, currentPage),
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

controls.forEach((el) => el.addEventListener('input', onChange));
$('prev').addEventListener('click', () => { currentPage--; updateUI(); });
$('next').addEventListener('click', () => { currentPage++; updateUI(); });

/* ---------- Exportar ---------- */

function setBusy(value) {
  busy = value;
  updateUI();
}

/** Genera todas las grillas, de a una, y devuelve File[] */
async function buildFiles(s, format) {
  const pages = pageCount(s);
  const files = [];
  for (let i = 0; i < pages; i++) {
    setStatus(`Generando grilla ${i + 1} de ${pages}…`);
    await sleep(0); // deja respirar a la interfaz
    const blob = await renderGridBlob(pagePhotos(s, i), s, format);
    files.push(new File([blob], fileName(i, blob), { type: blob.type }));
  }
  return files;
}

btnDownload.addEventListener('click', async () => {
  const s = readSettings();
  const format = $('format').value;
  const pages = pageCount(s);
  setBusy(true);
  try {
    for (let i = 0; i < pages; i++) {
      setStatus(`Generando grilla ${i + 1} de ${pages}…`);
      await sleep(0);
      const blob = await renderGridBlob(pagePhotos(s, i), s, format);
      downloadBlob(blob, fileName(i, blob));
      await sleep(400); // el navegador necesita un respiro entre descargas
    }
    setStatus(pages > 1 ? `Listo: ${pages} imágenes descargadas.` : 'Listo: imagen descargada.');
  } catch (err) {
    console.error(err);
    setStatus(`No se pudo generar la imagen: ${err.message}`);
  } finally {
    setBusy(false);
  }
});

btnShare.addEventListener('click', async () => {
  setBusy(true);
  try {
    const files = pendingShare ?? (await buildFiles(readSettings(), $('format').value));
    pendingShare = null;
    try {
      await navigator.share({ files });
      setStatus('');
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus(''); // cerró el menú, no es un error
      } else if (err.name === 'NotAllowedError') {
        pendingShare = files; // se venció el gesto: reintenta al instante
        setStatus('Listo. Tocá "Compartir" otra vez para enviar.');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    setStatus(`No se pudo compartir: ${err.message}`);
  } finally {
    setBusy(false);
  }
});

updateUI();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW no registrado', err));
}
