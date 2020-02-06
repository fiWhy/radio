import tmp from './player-video.html';
import { BehaviorSubject } from 'rxjs';
import { VideoPool } from './contracts/VideoPool';

const videoPool = new VideoPool();

const tmpWrapper = document.createElement('div');
tmpWrapper.innerHTML = tmp;
const playerTmp = tmpWrapper.querySelector('#video-player');

document.querySelector('#app').appendChild(playerTmp.content);
const videoBlock = document.querySelector('.video__player__theatre__content'),
  videoButtons = document.querySelector('.video__player__theatre__buttons');

window.onload = () => {
  videoPool.list$.subscribe(list => {
    videoButtons.innerHTML = '';
    list.forEach(qualityObject => {
      const btn = document.createElement('button');
      btn.textContent = qualityObject.quality;
      btn.addEventListener('click', () => {
        videoPool.playTag(qualityObject.quality);
      });
      videoButtons.appendChild(btn);
    });
  });

  videoPool.videoTag$.subscribe(video => {
    videoBlock.innerHTML = '';
    videoBlock.appendChild(video);
    video.play();
    video.volume = 0;
    // seek to 10 seconds
    video.currentTime = 10;
  });

  videoPool.update().subscribe(() => {
    videoPool.playTag('360');
  });
};
