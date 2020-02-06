export default class App extends HTMLElement {
  static tag = 'app-wrapper';

  static create() {
    return document.createElement(this.tag);
  }

  connectedCallback() {
    this.classList.add('container');
  }
}

customElements.define(App.tag, App, { extends: 'div' });
