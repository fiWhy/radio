import { Media } from './contracts/Media';
import { formatUrlToServer, codecs } from './constants';
import { filter } from 'rxjs/operators';

export default (videoWrapper, buttonsWrapper) => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoElement.controls = true;
  videoWrapper.appendChild(videoElement);

  const source = new Media(videoElement, {
    log: true,
    url: formatUrlToServer('/media/video/test-any/webm'),
    format: 'webm',
    codec: codecs['webm'],
    segmented: true,
    totalSegments: 3,
    segment: 1
  });

  source.appendControls(buttonsWrapper, [
    {
      text: 'Play',
      callback: () => {
        videoElement.play();
      }
    }
  ]);
  // return source.loadVideo(formatUrlToServer('/video/video-360.mp4'));
};
