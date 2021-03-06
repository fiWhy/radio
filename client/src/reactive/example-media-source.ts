import { Media } from './controllers/Media';
import { codecs, formatUrlToServer } from './constants';

export default videoWrapper => {
  const videoElement = document.createElement('video');
  videoElement.controls = true;
  videoWrapper.appendChild(videoElement);

  const source = new Media(videoElement, {
    log: true,
    segmented: true,
    totalSegments: 1
  });

  source.add({
    url: formatUrlToServer('/media/video/video-360-fragmented/mp4'),
    format: 'mp4',
    codec: codecs['mp4']
  });
};
