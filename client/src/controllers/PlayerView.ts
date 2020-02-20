import { PlayerOptions } from '../contracts/Media';
import { Subject, Subscription } from 'rxjs';

export abstract class PlayerView {
  private forbiddenProps = ['src'];
  private currentPlayerProps = {
    width: '100%',
    height: '100%',
    volume: 1
  };

  abstract sourceBuffer: SourceBuffer;
  abstract sourceElement: HTMLMediaElement;

  protected playerProps$ = new Subject<PlayerOptions>();
  protected sourceBufferProps$ = new Subject<PlayerOptions>();

  constructor() {
    this.playerProps$.subscribe(props => this.updatePlayerProps(props));
    this.sourceBufferProps$.subscribe(props =>
      this.updateSourceBufferProps(props)
    );
  }

  private updatePlayerProps(props: PlayerOptions) {
    this.currentPlayerProps = Object.assign(this.currentPlayerProps, props);
    this.playerProps$.next(this.currentPlayerProps);

    Object.keys(this.currentPlayerProps)
      .filter(propKey => !this.forbiddenProps.find(prop => prop === propKey))
      .forEach(propKey => {
        this.sourceElement.setAttribute(
          propKey,
          this.currentPlayerProps[propKey]
        );
      });
  }

  private updateSourceBufferProps(props = {}) {
    Object.keys(props).forEach(propKey => {
      this.sourceBuffer[propKey] = props[propKey];
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
}
