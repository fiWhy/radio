import { Media } from './controllers/Media';
import { formatUrlToServer, codecs } from './constants';

export default audioWrapper => {
  const audioElement = document.createElement('audio');
  audioElement.controls = true;
  audioWrapper.appendChild(audioElement);

  const source = new Media(audioElement, {
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
