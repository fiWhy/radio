import { Subject } from 'rxjs';

export class Player {
  __options = {};
  __sourceElement = null;
  __forbiddenProps = ['src'];
  __currentPlayerProps = {
    width: '100%',
    height: '100%',
    volume: 1
  };

  videoTag$ = new Subject();
  playerProps$ = new Subject();

  updatePlayerProps(props) {
    this.__currentPlayerProps = Object.assign(this.__currentPlayerProps, props);
    this.playerProps$.next(this.__currentPlayerProps);

    Object.keys(this.__currentPlayerProps)
      .filter(propKey => !this.__forbiddenProps.find(prop => prop === propKey))
      .forEach(propKey => {
        this.__sourceElement.setAttribute(
          propKey,
          this.__currentPlayerProps[propKey]
        );
      });
  }

  updateSourceBufferProps(props = {}) {
    Object.keys(props).forEach(propKey => {
      this.__sourceBuffer[propKey] = props[propKey];
    });
  }

  appendControls(element, controls) {
    controls.forEach(({ text, callback }) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.addEventListener('click', () => {
        callback(btn);
      });
      element.appendChild(btn);
    });
  }

  log(info) {
    if (this.__options.log) {
      console.log(`[Stream]. ${info}`);
    }
  }
}
