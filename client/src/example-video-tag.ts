import { formatUrlToServer } from './constants';

export default videoWrapper => {
  const videoElement = document.createElement('video');
  console.log(videoWrapper);
  videoWrapper.appendChild(videoElement);
  videoElement.controls = true;
  videoElement.src = formatUrlToServer('/media/video/frag_bunny/mp4');
};
