const tag = 'app-wrapper';

export default class App extends HTMLElement {
  static element = tag;

  static create() {
    return document.createElement(this.element);
  }

  constructor() {
    super();
  }

  connectedCallback() {
    console.log('Hello');
  }
}

customElements.define(tag, App);
