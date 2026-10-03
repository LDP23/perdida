// Dibuja el HUD: batería, intentos, nivel, puntos, IDs y avisos breves.
// Solo toca el DOM cuando un valor cambia.

export class HudView {
  #container;
  #batteryBar;
  #batteryNum;
  #livesIcons = [];
  #levelLabel;
  #scoreLabel;
  #crewLabel;
  #toastEl;
  #last = {};

  constructor(hudElement) {
    this.#container = hudElement;
    this.#build();
  }

  #build() {
    this.#container.innerHTML = '';

    // Izquierda: batería + intentos
    const left = this.#div('hud__left', this.#container);
    const batteryGroup = this.#div('hud__battery', left);
    this.#batteryBar = this.#div('hud__battery-bar', batteryGroup);
    this.#batteryNum = this.#div('hud__battery-num', batteryGroup);
    const livesGroup = this.#div('hud__lives', left);
    for (let i = 0; i < 3; i++) {
      const icon = this.#div('hud__life-icon', livesGroup);
      this.#livesIcons.push(icon);
    }

    // Centro: nivel
    this.#levelLabel = this.#div('hud__level', this.#container);

    // Derecha: puntos + IDs
    const right = this.#div('hud__right', this.#container);
    this.#scoreLabel = this.#div('hud__score', right);
    this.#crewLabel = this.#div('hud__crew', right);

    // Toast centrado abajo
    this.#toastEl = this.#div('hud__toast', this.#container);
  }

  sync(hud) {
    if (this.#last.batteryRatio !== hud.batteryRatio) {
      this.#batteryBar.style.setProperty('--ratio', hud.batteryRatio);
      this.#last.batteryRatio = hud.batteryRatio;
    }
    if (this.#last.battery !== Math.floor(hud.battery)) {
      this.#batteryNum.textContent = `${Math.floor(hud.battery)}%`;
      this.#last.battery = Math.floor(hud.battery);
    }
    if (this.#last.batteryLow !== hud.batteryLow) {
      this.#batteryBar.classList.toggle('is-low', hud.batteryLow);
      this.#last.batteryLow = hud.batteryLow;
    }
    if (this.#last.lives !== hud.lives) {
      for (let i = 0; i < this.#livesIcons.length; i++) {
        this.#livesIcons[i].classList.toggle('is-lost', i >= hud.lives);
      }
      this.#last.lives = hud.lives;
    }
    if (this.#last.levelName !== hud.levelName) {
      this.#levelLabel.textContent = hud.levelName;
      this.#last.levelName = hud.levelName;
    }
    if (this.#last.score !== hud.score) {
      this.#scoreLabel.textContent = String(hud.score).padStart(6, '0');
      this.#last.score = hud.score;
    }
    if (this.#last.crewFound !== hud.crewFound) {
      this.#crewLabel.textContent = `IDs: ${hud.crewFound}/${hud.crewTotal}`;
      this.#last.crewFound = hud.crewFound;
    }
    const toast = hud.toast;
    if (this.#last.toast !== toast) {
      this.#toastEl.textContent = toast;
      this.#toastEl.classList.toggle('is-visible', toast !== '');
      this.#last.toast = toast;
    }
  }

  destroy() {
    this.#container.innerHTML = '';
  }

  #div(className, parent) {
    const el = document.createElement('div');
    el.className = className;
    parent.append(el);
    return el;
  }
}
