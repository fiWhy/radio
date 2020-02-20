import { Player } from './Player';
import { MediaOptions } from '../contracts/Media';

export class Media extends Player {
  constructor(public sourceElement: HTMLMediaElement, options: MediaOptions) {
    super(options);
    this.initListeners();
  }

  add(source) {
    this.source$.next(source);
  }
}
