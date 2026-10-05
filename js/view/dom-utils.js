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

export function setPosition(element, x, y) {
  element.style.setProperty('--x', x);
  element.style.setProperty('--y', y);
}

export function setSize(element, width, height) {
  element.style.setProperty('--w', width);
  element.style.setProperty('--h', height);
}

export function setRect(element, rect) {
  setPosition(element, rect.x, rect.y);
  setSize(element, rect.width, rect.height);
}

// Busca los elementos marcados con data-ref. Las clases son para el CSS y
// data-ref para el JS: renombrar un estilo nunca rompe la lógica.
export function queryRefs(root, names) {
  const refs = {};
  for (const name of names) {
    const element = root.querySelector(`[data-ref="${name}"]`);
    if (!element) throw new Error(`Falta el elemento data-ref="${name}" en index.html`);
    refs[name] = element;
  }
  return refs;
}
