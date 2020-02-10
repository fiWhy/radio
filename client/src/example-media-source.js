import { Media } from './contracts/Media';
import { codecs, formatUrlToServer } from './constants';
import { filter, catchError, buffer } from 'rxjs/operators';

export default (videoWrapper, buttonsWrapper) => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoWrapper.appendChild(videoElement);
  const source = new Media(videoElement, 'webm');

  source.sourceReadyState$.pipe(filter(state => state)).subscribe(() => {
    source.loadVideo(formatUrlToServer('/media/video/test/any/webm'));
  });

  source.appendControls(buttonsWrapper, [
    {
      text: 'Play',
      callback: () => {
        videoElement.play();
      }
    }
  ])
  // return source.loadVideo(formatUrlToServer('/video/video-360.mp4'));
};
