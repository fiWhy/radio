import { Media } from './contracts/Media';
import { formatUrlToServer, codecs } from './constants';

export default videoWrapper => {
  const videoElement = document.createElement('audio');
  videoElement.controls = true;
  videoWrapper.appendChild(videoElement);

  const source = new Media(videoElement, {
    log: true,
    segmented: true,
    totalSegments: 20
  });

  source.add({
    url: formatUrlToServer('/media/audio/audio/mp3'),
    format: 'mp3',
    codec: 'audio/mpeg'
  });
};
