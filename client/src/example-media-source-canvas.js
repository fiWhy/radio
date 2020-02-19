import { Media } from './contracts/Media';
import { formatUrlToServer, codecs } from './constants';
import { processor } from './lib/stream';

export default videoWrapper => {
  const theatreContent = document.querySelector(
    '.video__player__theatre__content'
  );

  theatreContent.classList.add('centered');
  const canvas = document.createElement('canvas');
  const videoElement = document.createElement('video');
  videoWrapper.appendChild(canvas);

  processor.doLoad(canvas, videoElement, {
    width: 768,
    height: 480
  });

  const source = new Media(videoElement, {
    log: true,
    segmented: true,
    totalSegments: 40,
    sourceBuffer: {
      mode: 'sequence'
    }
  });

  canvas.width = 768;
  canvas.height = 480;

  source.add({
    url: formatUrlToServer('/media/video/video-360-fragmented/mp4'),
    format: 'mp4',
    codec: codecs['mp4']
  });

  source.appendControls(videoWrapper, [
    {
      text: 'Play',
      callback: btn => {
        if (videoElement.paused) {
          btn.textContent = 'Pause';
          videoElement.pla();
        } else {
          btn.textContent = 'Play';
          videoElement.pause();
        }
      }
    }
  ]);
  // return source.loadVideo(formatUrlToServer('/video/video-360.mp4'));
};
