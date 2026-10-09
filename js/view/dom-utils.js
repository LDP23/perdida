/**
 * @module dom-utils
 *
 * Utilidades de DOM: crear elementos, posicionar con variables CSS de geometría
 * (--x, --y, --w, --h), y buscar elementos por data-ref.
 *
 * Convención: el JavaScript solo escribe variables CSS de geometría. El aspecto
 * visual lo decide el CSS. Las clases son para CSS; data-ref para JS — renombrar
 * un estilo nunca rompe la lógica.
 *
 * Usado por: todas las vistas (EntityView, PlayerView, HudView, etc.).
 * Depende de: nada.
 */

/**
 * Crea un div con la clase dada y lo agrega al padre.
 * @param {string} className
 * @param {HTMLElement|null} parent
 * @returns {HTMLElement}
 */
export function createElement(className, parent) {
  const element = document.createElement('div');
  element.className = className;
  parent?.append(element);
  return element;
}

/**
 * Escribe las variables CSS --x e --y en el elemento.
 * @param {HTMLElement} element
 * @param {number} x
 * @param {number} y
 */
export function setPosition(element, x, y) {
  element.style.setProperty('--x', x);
  element.style.setProperty('--y', y);
}

/**
 * Escribe las variables CSS --w y --h en el elemento.
 * @param {HTMLElement} element
 * @param {number} width
 * @param {number} height
 */
export function setSize(element, width, height) {
  element.style.setProperty('--w', width);
  element.style.setProperty('--h', height);
}

/**
 * Escribe las 4 variables de geometría (--x, --y, --w, --h) a partir de un Rect.
 * @param {HTMLElement} element
 * @param {{x: number, y: number, width: number, height: number}} rect
 */
export function setRect(element, rect) {
  setPosition(element, rect.x, rect.y);
  setSize(element, rect.width, rect.height);
}

/**
 * Busca los elementos marcados con data-ref y devuelve un mapa nombre→elemento.
 * Lanza un error si falta alguno — detecta errores de estructura en index.html.
 * @param {HTMLElement|Document} root — raíz de búsqueda.
 * @param {string[]} names — nombres de data-ref esperados.
 * @returns {Object.<string, HTMLElement>}
 */
export function queryRefs(root, names) {
  const refs = {};
  for (const name of names) {
    const element = root.querySelector(`[data-ref="${name}"]`);
    if (!element) throw new Error(`Falta el elemento data-ref="${name}" en index.html`);
    refs[name] = element;
  }
  return refs;
}
