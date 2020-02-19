import { Media } from './contracts/Media';
import { formatUrlToServer } from './constants';
import visualize from './lib/visualizer';

export default videoWrapper => {
  document.body.classList.add('visualizer');
  document.querySelector('#app').remove();
  const canvas = document.createElement('canvas');
  const callToAction = document.createElement('div');
  callToAction.classList.add('call-to-action');
  callToAction.textContent = 'Click to play!';

  canvas.width = 460;
  canvas.height = 320;

  const sourceElement = document.createElement('audio');
  sourceElement.controls = false;
  videoWrapper.appendChild(canvas);
  videoWrapper.appendChild(callToAction);

  const source = new Media(sourceElement, {
    log: true,
    segmented: true,
    totalSegments: 10
  });

  visualize(canvas, sourceElement);

  source.add({
    url: formatUrlToServer('/media/audio/audio/mp3'),
    format: 'mp3',
    codec: 'audio/mpeg'
  });
};
