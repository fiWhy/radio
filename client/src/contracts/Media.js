import { fromEvent, throwError, from } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';
import { Player } from './Player';
import { promiseTime } from '../lib/time';
import { parseMPD } from '../lib/stream';

export class Media extends Player {
  __mediaSource = new MediaSource();
  __isSourceOpened = false;
  __sourceBuffer = null;
  __queue = [];
  __currentSegment = 0;
  __fileSize = 0;
  __segmentLength = 0;
  __segmentDuration = 0;
  __source = null;
  __duration = null;

  __options = {};

  __segmentsLoadingState = [];

  sourceBufferUpdateSubscription;
  sourceBufferUpdateEndSubscription;
  sourceCanPlaySubscription;
  sourceTimeUpdateSubscription;
  /**
   *
   * @param {HTMLVideoElement} sourceElement
   * @param {Object} options
   * @param {boolean} options.segmented? should source be segmented
   * @param {number} options.startTime? start from
   * @param {number} options.totalSegments? how many segments should source be splitted by
   * @param {number} options.segment? what segment is current
   */
  constructor(sourceElement, options) {
    super();
    this.__options = Object.assign({}, options, {
      totalSegments: options.totalSegments < 0 ? 0 : options.totalSegments
    });
    this.__sourceElement = sourceElement;
    this.__currentSegment = 0;
    this.__segments = [];
    this.__queue = [];
    this.__sourceElement.src = URL.createObjectURL(this.__mediaSource);
  }

  get duration() {
    return this.__duration || this.__sourceElement.duration;
  }

  get source() {
    return this.__sourceElement;
  }

  get currentSegmentStart() {
    return this.__currentSegment * this.__segmentLength;
  }

  get currentSegmentEnd() {
    return Math.min(
      this.currentSegmentStart + this.__segmentLength,
      this.__fileSize - 1
    );
  }

  __initListeners() {
    const sourceOpenSubscription = fromEvent(this.__mediaSource, 'sourceopen')
      .pipe(first())
      .subscribe(() => {
        this.log('Source opened');
        this.createMediaSource();
        this.handleSourceOpened();
        sourceOpenSubscription.unsubscribe();
      });

    // this.videoSeekSubscription = fromEvent(
    //   this.__sourceElement,
    //   'seeking'
    // ).subscribe(e => this.seek(e));

    this.sourceCanPlaySubscription = fromEvent(this.__sourceElement, 'canplay')
      .pipe(
        filter(() => this.__options.segmented),
        first()
      )
      .subscribe(() => {
        this.log('source could be played');
        this.log(`Duration - ${this.duration}`);
        this.updateSegmentDuration();
      });

    this.sourceTimeUpdateSubscription = fromEvent(
      this.__sourceElement,
      'timeupdate'
    )
      .pipe(filter(() => this.__options.segmented))
      .subscribe(() => {
        this.handleVideoTimeUpdate();
      });
  }

  /**
   *
   * @param {Object} source
   * @param {string} source.url url to source
   * @param {string} source.format format (.mp4)?
   * @param {string} source.codec codec string
   */
  add(source) {
    this.__source = source;
    this.__initListeners();
    this.log('Start working on common media file');
    this.loadMedia();
  }

  createMediaSource() {
    const { codec } = this.__source;
    if (MediaSource.isTypeSupported(codec)) {
      this.__sourceBuffer = this.__mediaSource.addSourceBuffer(codec);
      this.updatePlayerProps();
      this.updateSourceBufferProps(this.__options.sourceBuffer);
    } else {
      return throwError(`Unsupported MIME type or codec: ${codec}`);
    }
  }

  /**
   * Start reading streamed data
   * @param {string} addr address of source storage
   */
  getStat(addr) {
    return fetch(`${addr}/stat`, {
      method: 'head'
    }).then(response => ({
      fileSize: Number(response.headers.get('Content-Length')),
      type: response.headers.get('Content-Type'),
      duration: response.headers.get('X-Duration')
    }));
  }

  /**
   * Start reading streamed data
   * @param {Object} options clarify what do you want from stream
   * @param {boolean} options.segmented load by segments
   * @param {number} options.totalSegments splitted by chunks
   * @param {number} options.segment what chunk to load
   */
  loadMedia() {
    const { segmented, totalSegments } = this.__options;
    const { url } = this.__source;
    if (segmented) {
      return this.getStat(url).then(({ fileSize, duration }) => {
        console.log(duration);
        this.__bySegments = segmented;
        this.__duration = duration;
        this.__segmentLength = Math.round(fileSize / totalSegments);
        this.__fileSize = fileSize;

        this.updateSegmentDuration();
        return this.__load(this.currentSegmentStart, this.currentSegmentEnd);
      });
    }

    return this.__load(this.currentSegmentStart, '');
  }

  /**
   * Start reading streamed data
   * @param {number} start bytes start
   * @param {number} end bytes end
   */
  __load(start, end) {
    this.log(`Load segment ${start}-${end}`);
    const { url } = this.__source;
    return promiseTime(
      fetch(url, {
        headers: {
          Range: `bytes=${start}-${end}`
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(response.statusText);
          }

          return response;
        })
        .then(response => response.arrayBuffer())
        .then(buffer => {
          this.__segments[this.__currentSegment] = buffer;
          this.addChunkToSourceBuffer(buffer);
          this.__currentSegment++;
          this.log(`${this.__currentSegment} segment[s] loaded.`);
          return this.__sourceElement;
        })
    ).then(([data, time]) => {
      this.log(`Loading took ${time}ms`);
      return data;
    });
  }

  addChunkToSourceBuffer(buffer) {
    if (this.__sourceBuffer.updating) {
      this.__queue.push(buffer);
    } else {
      this.__sourceBuffer.appendBuffer(buffer);
    }
  }

  seek(e) {
    const segment = (this.__currentSegment =
      this.calculateCurrentSegmentByTime() - 1);
    this.log(`Seeking. Requested segment ${segment}`);
    if (this.__segments[segment]) {
      this.log('Requested segment was already loaded. Appending!');
    } else {
      this.log('Requested segment wasnt loaded. Loading...');
      if (this.__mediaSource.readyState === 'open') {
        this.__sourceBuffer.abort();
        this.__load(this.currentSegmentStart + 1, this.currentSegmentEnd);
      }
    }
  }

  handleSourceOpened() {
    this.__sourceBuffer.onerror = err => {
      this.log('UpdateError', err);
    };

    this.sourceBufferUpdateEndSubscription = fromEvent(
      this.__sourceBuffer,
      'updateend'
    )
      .pipe(
        filter(() => this.__queue.length),
        map(() => this.__queue.shift())
      )
      .subscribe(buffer => {
        this.__sourceBuffer.appendBuffer(buffer);
      });
  }

  handleVideoTimeUpdate() {
    this.log('Time update');
    if (this.__options.totalSegments === this.__currentSegment) {
      this.finishStream();
    } else if (this.shouldSegmentBeFetched()) {
      this.log(`Request new segment ${this.__sourceElement.currentTime}`);
      this.__segmentsLoadingState[this.__currentSegment] = true;
      this.__load(this.currentSegmentStart + 1, this.currentSegmentEnd);
    }
  }

  finishStream() {
    if (
      !this.__sourceBuffer.updating &&
      this.__mediaSource.readyState === 'open'
    ) {
      this.__mediaSource.endOfStream();
      this.sourceCanPlaySubscription.unsubscribe();
      this.sourceTimeUpdateSubscription.unsubscribe();
      this.sourceBufferUpdateEndSubscription.unsubscribe();
      this.clearQueue();
      this.log('Finished');
    }
  }

  shouldSegmentBeFetched() {
    console.log(
      this.__sourceElement.currentTime,
      this.__segmentDuration * this.__currentSegment * 0.5
    );
    return (
      this.__sourceElement.currentTime >
        this.__segmentDuration * this.__currentSegment * 0.5 &&
      !this.__segmentsLoadingState[this.__currentSegment]
    );
  }

  updateSegmentDuration() {
    this.__segmentDuration = this.duration / this.__options.totalSegments;
    this.log(`Segment duration - ${this.__segmentDuration}`);
  }

  calculateCurrentSegmentByTime() {
    return Math.ceil(
      this.__sourceElement.currentTime /
        (this.duration / (this.__options.totalSegments || 1))
    );
  }

  clearQueue() {
    this.__queue = [];
  }
}
