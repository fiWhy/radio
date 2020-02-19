import tmp from './player-video.html';

import videoPoolExample from './example-video-tag';
import mediaSourceExample from './example-media-source';
import audioExample from './example-media-source-audio';
import videoCanvas from './example-media-source-canvas';
import audioVisualizationExample from './example-media-source-audio-visualization';
import dashExample from './example-dash';
import mediaSourceExampleBySegment from './example-media-source-by-segment';

const tmpWrapper = document.createElement('div');
tmpWrapper.innerHTML = tmp;
const playerTmp = tmpWrapper.querySelector('#video-player');

document.querySelector('#app').appendChild(playerTmp.content);

const elementWrapper = document.querySelector(
  '.video__player__theatre__content'
);

// videoPoolExample(elementWrapper);
// mediaSourceExample(elementWrapper);
// mediaSourceExampleBySegment(elementWrapper);
// audioExample(elementWrapper);
// videoCanvas(elementWrapper);
// dashExample(elementWrapper);
audioVisualizationExample(document.body);