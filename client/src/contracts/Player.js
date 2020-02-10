import { Subject } from 'rxjs';

export class Player {
  __videoElement = null;
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
        this.__videoElement.setAttribute(
          propKey,
          this.__currentPlayerProps[propKey]
        );
      });
  }

  appendControls(element, controls) {
    controls.forEach(({ text, callback }) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.addEventListener('click', () => {
        callback();
      });
      element.appendChild(btn);
    });
  }
}
