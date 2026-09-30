// Únicos puntos donde el JavaScript escribe estilos: solo variables CSS de
// geometría (--x, --y, --w, --h). El aspecto visual siempre lo decide el CSS.

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
