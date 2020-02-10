import { VideoPool } from './contracts/VideoPool';
const videoPool = new VideoPool();

export default (videoWrapper, videoButtonsWrapper) => {
  videoPool.list$.subscribe(list => {
    videoButtonsWrapper.innerHTML = '';
    const controls = list.map(qualityObject => ({
      text: qualityObject.quality,
      callback: () => {
        videoPool.playTag(qualityObject.quality);
      }
    }));

    videoPool.appendControls(controls);
  });

  videoPool.videoTag$.subscribe(video => {
    videoWrapper.innerHTML = '';
    videoWrapper.appendChild(video);
    video.play();
    video.volume = 0;
    // seek to 10 seconds
    video.currentTime = 10;
  });

  videoPool.update().subscribe(() => {
    videoPool.playTag('360');
  });
};
