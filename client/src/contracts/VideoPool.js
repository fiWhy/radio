import { serverUrl } from '../constants';
import { fromFetch } from 'rxjs/fetch';
import { Subject, of } from 'rxjs';
import { pickVideoQualityFromList } from '../lib/file';
import { filter, tap, switchMap, map } from 'rxjs/operators';
import { Player } from './Player';

export class VideoPool extends Player {
  static serverVideoUrl = `${serverUrl}/media/video`;
  __currentList = null;
  __currentVideoTags = null;
  __currentQuality = null;
  list$ = new Subject();
  preparedVideoTags$ = this.list$.pipe(
    filter(list => list.length),
    switchMap(() => this.generateVideoTags())
  );


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
