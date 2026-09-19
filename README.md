# Grid Maker

Herramienta web liviana para armar grillas de fotos (hasta 4x4)

**[Abrir la app](https://martinez-tiago.github.io/grid-maker/)**

## Características

- Grillas de 1x1 hasta 4x4, con filas y columnas configurables.
- Carga de muchas fotos a la vez: si sobran fotos, se reparten en varias
  grillas automáticamente (por ejemplo, 12 fotos en 3x2 dan 2 grillas).
- Selección, reordenamiento y eliminación de fotos.
- Proporción de celda 3:4, 4:5 o 1:1, con recorte centrado o foto completa.
- Separación entre fotos y color de fondo ajustables.
- Exporta a JPG, PNG o WebP.
- Compartir directo con el menú nativo del sistema (WhatsApp, Instagram, etc.).
- Instalable como app y funciona sin conexión (PWA).

## Privacidad

Todo se procesa en tu dispositivo. Las fotos no se suben a ningún servidor y
la app no usa cookies, cuentas ni analítica.

## Uso

1. Abrí la app y tocá **Elegir fotos** para seleccionar las imágenes.
2. Elegí la cantidad de columnas y filas, y ajustá proporción y separación.
3. Tocá una miniatura para moverla o quitarla.
4. Usá **Descargar** o **Compartir** para obtener todas las grillas.

Para instalarla en Android: abrila en Chrome, menú ⋮ → **Instalar app**.

## Desarrollo local

No hay dependencias ni paso de compilación:

```bash
git clone https://github.com/Martinez-Tiago/grid-maker.git
cd grid-maker
python3 -m http.server 8000
```

Abrí `http://localhost:8000`.

## Decisiones técnicas

- **JavaScript puro**, sin frameworks ni librerías.
- **Bajo consumo de memoria**: las fotos se reducen al cargarlas.
  La vista previa usa un canvas chico y solo al exportar se renderiza al
  tamaño final.
- **Tope de exportación** de 4320 px por lado y 16 megapíxeles, para que no
  falle en celulares antiguos. Las grillas grandes se reducen automáticamente.
- Las grillas se generan de a una, liberando memoria entre cada una.

## Licencia

[MIT](LICENSE)
