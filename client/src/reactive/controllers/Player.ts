import { Subject, fromEvent, Subscription, throwError, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { filter, first, map, switchMap } from 'rxjs/operators';
import { Source, MediaOptions } from '../contracts/Media';
import { PlayerView } from './PlayerView';

export abstract class Player extends PlayerView {
  abstract sourceElement: HTMLMediaElement;

  private currentSegment = 0;
  private segments = [];
  private mediaSource = new MediaSource();
  private segmentLength = 0;
  private fileSize = 0;
  private queue = [];
  private segmentDuration = 0;
  private source: Source = null;
  private segmentsLoadingState = [];

  private sourceBufferUpdateEndSubscription: Subscription;
  private sourceTimeUpdateSubscription: Subscription;
  private sourceAddSubscription: Subscription;

  private mediaChunk$ = new Subject();
  private loadChunk$ = new Subject<[number, number | '']>();

  protected mediaDuration: number = null;

  protected source$ = new Subject<Source>();

  sourceBuffer: SourceBuffer = null;

  constructor(private options: MediaOptions) {
    super();
    this.options.totalSegments =
      options.totalSegments < 0 ? 0 : options.totalSegments;
    this.queue = [];
  }

  protected initListeners() {
    this.sourceElement.src = URL.createObjectURL(this.mediaSource);

    this.source$.subscribe(source => {
      this.source = source;
      this.registerSourceListeners();
      this.log('Start working on common media file');
      this.loadMedia();
    });

    this.mediaChunk$.subscribe((chunk: ArrayBuffer) => {
      this.segments[this.currentSegment] = chunk;
      this.addChunkToSourceBuffer(chunk);
      this.currentSegment++;
      this.log(`${this.currentSegment} segment[s] loaded.`);
    });

    this.loadChunk$.subscribe(([byteRangeStart, byteRangeEnd]) => {
      this.load(byteRangeStart, byteRangeEnd);
    });
  }

  private log(info) {
    if (this.options.log) {
      console.log(`[Stream]. ${info}`);
    }
  }

  private registerSourceListeners() {
    fromEvent(this.mediaSource, 'sourceopen')
      .pipe(first())
      .subscribe(() => {
        this.log('Source opened');
        this.createMediaSource();
        this.handleSourceOpened();
      });

    fromEvent(this.sourceElement, 'canplay')
      .pipe(
        filter(() => this.options.segmented),
        first()
      )
      .subscribe(() => {
        this.log('source could be played');
        this.log(`Duration - ${this.duration}`);
        this.updateSegmentDuration();
      });

    this.sourceTimeUpdateSubscription = fromEvent(
      this.sourceElement,
      'timeupdate'
    )
      .pipe(filter(() => this.options.segmented))
      .subscribe(() => {
        this.handleVideoTimeUpdate();
      });
  }

  private createMediaSource() {
    const { codec } = this.source;
    if (MediaSource.isTypeSupported(codec)) {
      this.sourceBuffer = this.mediaSource.addSourceBuffer(codec);
      this.sourceBufferProps$.next(this.options.sourceBufferOptions);
    } else {
      return throwError(`Unsupported MIME type or codec: ${codec}`);
    }
  }

  private loadMedia() {
    const { segmented, totalSegments } = this.options;
    const { url } = this.source;
    if (segmented) {
      return this.getStat(url).subscribe(({ fileSize, duration }) => {
        this.mediaDuration = duration;
        this.segmentLength = Math.round(fileSize / totalSegments);
        this.fileSize = fileSize;

        this.updateSegmentDuration();
        return this.loadChunk$.next([
          this.currentSegmentStart,
          this.currentSegmentEnd
        ]);
      });
    }

    return this.loadChunk$.next([this.currentSegmentStart, '']);
  }

  private addChunkToSourceBuffer(buffer) {
    if (this.sourceBuffer.updating) {
      this.queue.push(buffer);
    } else {
      this.sourceBuffer.appendBuffer(buffer);
    }
  }

  private handleSourceOpened() {
    fromEvent(this.sourceBuffer, 'error')
      .pipe(first())
      .subscribe(err => {
        this.log('UpdateError');
        this.log(err);
      });

    this.sourceBufferUpdateEndSubscription = fromEvent(
      this.sourceBuffer,
      'updateend'
    )
      .pipe(
        filter(() => Boolean(this.queue.length)),
        map(() => this.queue.shift())
      )
      .subscribe(buffer => {
        this.sourceBuffer.appendBuffer(buffer);
      });
  }

  private handleVideoTimeUpdate() {
    this.log('Time update');
    if (this.options.totalSegments === this.currentSegment) {
      this.finishStream();
    } else if (this.shouldSegmentBeFetched()) {
      this.log(`Request new segment ${this.sourceElement.currentTime}`);
      this.segmentsLoadingState[this.currentSegment] = true;
      this.loadChunk$.next([
        this.currentSegmentStart + 1,
        this.currentSegmentEnd
      ]);
    }
  }

  private finishStream() {
    if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
      this.mediaSource.endOfStream();
      this.sourceTimeUpdateSubscription.unsubscribe();
      this.sourceBufferUpdateEndSubscription.unsubscribe();
      this.sourceAddSubscription.unsubscribe();
      this.clearQueue();
      this.log('Finished');
    }
  }

  private shouldSegmentBeFetched() {
    return (
      this.sourceElement.currentTime >
        this.segmentDuration * this.currentSegment * 0.5 &&
      !this.segmentsLoadingState[this.currentSegment]
    );
  }

  private updateSegmentDuration() {
    this.segmentDuration = this.duration / this.options.totalSegments;
    this.log(`Segment duration - ${this.segmentDuration}`);
  }

  private clearQueue() {
    this.queue = [];
  }

  protected load(start, end) {
    this.log(`Load segment ${start}-${end}`);
    const { url } = this.source;
    return fromFetch(url, {
      headers: {
        Range: `bytes=${start}-${end}`
      }
    })
      .pipe(
        switchMap((response: Response) =>
          response.ok
            ? response.arrayBuffer()
            : of({ error: true, message: `Error ${response.status}` })
        )
      )
      .subscribe(buffer => {
        this.mediaChunk$.next(buffer);
      });
  }

  get currentSegmentStart() {
    return this.currentSegment * this.segmentLength;
  }

  get currentSegmentEnd() {
    return Math.min(
      this.currentSegmentStart + this.segmentLength,
      this.fileSize - 1
    );
  }
  get duration() {
    return this.mediaDuration || this.sourceElement.duration;
  }

  getStat(addr) {
    return fromFetch(`${addr}/stat`, {
      method: 'head'
    }).pipe(
      map(response => ({
        fileSize: Number(response.headers.get('Content-Length')),
        type: response.headers.get('Content-Type'),
        duration: Number(response.headers.get('X-Duration'))
      }))
    );
  }
}
