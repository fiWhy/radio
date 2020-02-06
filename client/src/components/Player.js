export default class Player extends HTMLElement {
  static tag = 'app-player';
  static create() {
    return document.createElement('app-player');
  }

  connectedCallback() {
    this.classList.add('row');
  }
}

customElements.define('app-player', Player, { extends: 'div' });
