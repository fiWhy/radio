import { formatUrlToServer } from './constants';

export default videoWrapper => {
  const videoElement = document.createElement('video');
  videoWrapper.appendChild(videoElement);
  videoElement.controls = true;
  videoElement.src = formatUrlToServer('/media/video/video-360-fragmented/mp4');
};
