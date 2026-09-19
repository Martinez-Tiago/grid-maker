/** Convierte "3/4" en 0.75 */
export function parseRatio(str) {
  const [w, h] = str.split('/').map(Number);
  return w / h;
}

/** Calcula tamaños totales del lienzo. Todo en píxeles. */
export function getLayout({ cols, rows, ratio, cellW, gap }) {
  const cellH = Math.round(cellW / ratio);
  return {
    cellW,
    cellH,
    gap,
    width: cols * cellW + (cols + 1) * gap,
    height: rows * cellH + (rows + 1) * gap,
  };
}

/** Escala la separación (unidades de 1080 px) al tamaño real de celda */
export function gapPx(gapUnits, cellW) {
  return Math.round((gapUnits * cellW) / 1080);
}

/** Ancho de celda para que la grilla completa mida `totalW` de ancho (vista previa) */
export function cellWidthForTotal(totalW, cols, gapUnits) {
  return Math.floor(totalW / (cols + ((cols + 1) * gapUnits) / 1080));
}

/**
 * Dibuja la grilla en un canvas.
 * opts: { photos, cols, rows, ratio, fit, gap, bg, cellW, placeholders }
 * `gap` va en píxeles ya escalados.
 */
export function drawGrid(canvas, opts) {
  const L = getLayout(opts);
  canvas.width = L.width;
  canvas.height = L.height;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, L.width, L.height);
  ctx.imageSmoothingQuality = 'high';

  for (let r = 0; r < opts.rows; r++) {
    for (let c = 0; c < opts.cols; c++) {
      const x = L.gap + c * (L.cellW + L.gap);
      const y = L.gap + r * (L.cellH + L.gap);
      const img = opts.photos[r * opts.cols + c];

      if (img) {
        drawPhoto(ctx, img, x, y, L.cellW, L.cellH, opts.fit);
      } else if (opts.placeholders) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.18)';
        ctx.fillRect(x, y, L.cellW, L.cellH);
      }
    }
  }
  return L;
}

function drawPhoto(ctx, img, x, y, w, h, fit) {
  if (fit === 'contain') {
    const s = Math.min(w / img.width, h / img.height);
    const dw = img.width * s;
    const dh = img.height * s;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    // cover: recorte centrado de la foto original
    const s = Math.max(w / img.width, h / img.height);
    const sw = w / s;
    const sh = h / s;
    ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
  }
}
