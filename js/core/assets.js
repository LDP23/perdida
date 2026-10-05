/**
 * @module assets
 *
 * Precarga y caché de imágenes. Garantiza que una imagen esté descargada y
 * decodificada ANTES de mostrarla, evitando el parpadeo negro al cambiar de escena.
 *
 * Usado por: scene-flow.js (precarga fondos de escena), level-loader.js.
 * Depende de: nada.
 */

/** @type {Map<string, Promise<HTMLImageElement>>} — caché URL → promesa de imagen decodificada */
const imageCache = new Map();

/**
 * Devuelve una promesa que resuelve con la imagen decodificada.
 * Si la misma URL ya se pidió antes, devuelve la promesa cacheada (sin descargar dos veces).
 *
 * @param {string} url — ruta de la imagen (relativa o absoluta).
 * @returns {Promise<HTMLImageElement>} imagen lista para usar.
 */
export function loadImage(url) {
  if (!imageCache.has(url)) imageCache.set(url, decodeImage(url));
  return imageCache.get(url);
}

/**
 * @param {string} url — ruta de la imagen a decodificar.
 * @returns {Promise<HTMLImageElement>} imagen decodificada.
 */
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
