import tmp from './player-video.html';

import videoPoolExample from './example-video-tag';
import mediaSourceExample from './example-media-source';
import mediaSourceExampleBySegment from './example-media-source-by-segment';
import { fromEvent } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

const tmpWrapper = document.createElement('div');
tmpWrapper.innerHTML = tmp;
const playerTmp = tmpWrapper.querySelector('#video-player');

document.querySelector('#app').appendChild(playerTmp.content);
const videoWrapper = document.querySelector('.video__player__theatre__content'),
  videoButtonsWrapper = document.querySelector(
    '.video__player__theatre__buttons'
  );

window.onload = () => {
  // mediaSourceExample(videoWrapper, videoButtonsWrapper);
  mediaSourceExampleBySegment(videoWrapper, videoButtonsWrapper);
  // videoPoolExample(videoWrapper, videoButtonsWrapper);
};
