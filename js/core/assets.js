// Carga de imágenes antes de mostrarlas: sin esto, al cambiar de escena se vería
// un parpadeo negro mientras el navegador descarga y decodifica el fondo.
const imageCache = new Map();

export function loadImage(url) {
  if (!imageCache.has(url)) imageCache.set(url, decodeImage(url));
  return imageCache.get(url);
}

async function decodeImage(url) {
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
  } catch {
    imageCache.delete(url);
    throw new Error(`No se pudo cargar la imagen: ${url}`);
  }
  return image;
}
