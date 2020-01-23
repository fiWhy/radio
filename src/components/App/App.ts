export default class App extends HTMLDivElement {
  static element = "radio-wrapper";

  static create() {
    return document.createElement(this.element);
  }
}
