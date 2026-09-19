const WORK_HEIGHT = 1200; // altura de trabajo: evita guardar 12 MP por foto

const fileInput = document.getElementById('file-input');
const thumbs = document.getElementById('thumbs');
const photoCount = document.getElementById('photo-count');

/** @type {ImageBitmap[]} */
const photos = [];

fileInput.addEventListener('change', async (e) => {
  const files = [...e.target.files];
  // Procesamos de a una para no disparar el uso de RAM
  for (const file of files) {
    try {
      const bitmap = await createImageBitmap(file, {
        resizeHeight: WORK_HEIGHT,
        resizeQuality: 'medium',
      });
      photos.push(bitmap);
      addThumb(bitmap);
      updateCount();
    } catch (err) {
      console.warn('No se pudo leer', file.name, err);
    }
  }
  fileInput.value = ''; // permite volver a elegir las mismas fotos
});

function addThumb(bitmap) {
  const c = document.createElement('canvas');
  c.width = 90;
  c.height = 120;
  const ctx = c.getContext('2d');
  // cover simple, solo para la miniatura
  const scale = Math.max(c.width / bitmap.width, c.height / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (c.width - w) / 2, (c.height - h) / 2, w, h);
  thumbs.appendChild(c);
}

function updateCount() {
  photoCount.textContent = `${photos.length} foto${photos.length === 1 ? '' : 's'} cargada${photos.length === 1 ? '' : 's'}`;
}
