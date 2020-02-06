import { serverUrl } from '../constants';
import { fromFetch } from 'rxjs/fetch';
import { Subject, of } from 'rxjs';
import { pickVideoQualityFromList } from '../lib/file';
import { filter, tap, switchMap, map } from 'rxjs/operators';

export class VideoPool {
  static serverVideoUrl = `${serverUrl}/media/video`;
  __forbiddenProps = ['src'];
  __currentList = null;
  __currentVideoTag = null;
  __currentVideoTags = null;
  __currentQuality = null;
  __currentPlayerProps = {
    width: '100%',
    height: '100%',
    volume: 1
  };
  list$ = new Subject();
  playerProps$ = new Subject();
  preparedVideoTags$ = this.list$.pipe(
    filter(list => list.length),
    switchMap(() => this.generateVideoTags())
  );

  videoTag$ = new Subject();

  get currentQuality() {
    return this.__currentQuality;
  }

  update() {
    return fromFetch(VideoPool.serverVideoUrl).pipe(
      switchMap(response => response.json()),
      tap(data => this.list$.next((this.__currentList = data))),
      switchMap(() => this.generateVideoTags())
    );
  }

  updatePlayerProps(props) {
    this.__currentPlayerProps = Object.assign(this.__currentPlayerProps, props);
    this.playerProps$.next(this.__currentPlayerProps);

    Object.keys(this.__currentPlayerProps)
      .filter(propKey => !this.__forbiddenProps.find(prop => prop === propKey))
      .forEach(propKey => {
        this.__currentVideoTag.setAttribute(
          propKey,
          this.__currentPlayerProps[propKey]
        );
      });
  }

  getStream(fileName, quality, format) {
    return fromFetch(
      `${VideoPool.serverVideoUrl}/${fileName}/${quality}/${format}`
    );
  }

  playTag(quality) {
    this.__currentQuality = quality;
    this.__currentVideoTag = this.__currentVideoTags.get(quality);
    this.videoTag$.next(this.__currentVideoTag);
    this.updatePlayerProps({});
  }

  generateVideoTags() {
    return of(
      (this.__currentVideoTags = new Map(
        this.__currentList.map(videoInfo => [
          videoInfo.quality,
          this.getVideoTagFromQuality(videoInfo.quality)
        ])
      ))
    );
  }

  getVideoTagFromQuality(quality) {
    const { name, format } = pickVideoQualityFromList(quality)(
      this.__currentList
    );
    const video = document.createElement('video');

    video.setAttribute(
      'src',
      `${serverUrl}/video/${name}-${quality}.${format}`
    );

    return video;
  }
}
