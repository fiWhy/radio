import { Media } from './contracts/Media';
import { codecs, formatUrlToServer } from './constants';
import { filter, catchError, buffer } from 'rxjs/operators';

export default (videoWrapper, buttonsWrapper) => {
  const videoElement = document.createElement('video');
  videoElement.controls = true;
  videoWrapper.appendChild(videoElement);

  const source = new Media(videoElement, {
    log: true,
    segmented: true,
    totalSegments: 1
  });

  source.add({
    url: formatUrlToServer('/media/video/frag_bunny/mp4'),
    format: 'mp4',
    codec: codecs['mp4']
  });
};
