import { drawGrid, getLayout, gapPx } from './grid.js';

const CELL_W = 1080;
const MAX_SIDE = 4320;
const MAX_PIXELS = 16_000_000;

/** Ancho de celda para exportar, reducido si el lienzo pasa los topes */
export function exportCellWidth({ cols, rows, ratio, gapUnits }) {
  const L = getLayout({ cols, rows, ratio, cellW: CELL_W, gap: gapPx(gapUnits, CELL_W) });
  const k = Math.min(
    1,
    MAX_SIDE / Math.max(L.width, L.height),
    Math.sqrt(MAX_PIXELS / (L.width * L.height))
  );
  return Math.floor(CELL_W * k);
}

/** Dibuja una grilla a tamaño final y devuelve el Blob. Libera el canvas al terminar. */
export async function renderGridBlob(pagePhotos, s, format) {
  const canvas = document.createElement('canvas');
  const cellW = exportCellWidth(s);
  drawGrid(canvas, {
    photos: pagePhotos,
    cols: s.cols,
    rows: s.rows,
    ratio: s.ratio,
    fit: s.fit,
    bg: s.bg,
    cellW,
    gap: gapPx(s.gapUnits, cellW),
    placeholders: false,
  });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, 0.92));
  canvas.width = canvas.height = 0; // libera memoria
  if (!blob) throw new Error('el navegador no pudo generar la imagen');
  return blob;
}

/** Nombre de archivo según el tipo real del blob (Safari cae a PNG si no soporta WebP) */
export function fileName(index, blob) {
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[blob.type] ?? 'img';
  return `grilla-${index + 1}.${ext}`;
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** ¿Puede este navegador compartir archivos? (requiere HTTPS o localhost) */
export function shareSupported() {
  if (!navigator.share || !navigator.canShare) return false;
  const probe = new File(['x'], 'probe.jpg', { type: 'image/jpeg' });
  return navigator.canShare({ files: [probe] });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
