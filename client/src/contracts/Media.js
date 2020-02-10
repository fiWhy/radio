import { fromEvent, throwError } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { Player } from './Player';

export class Media extends Player {
  __mediaSource = new MediaSource();
  __isSourceOpened = false;
  __sourceBuffer = null;
  __mimeCodec = null;
  __queue = [];
  __currentSegment = 0;
  __fileSize = 0;
  __segmentLength = 0;
  __segmentDuration = 0;

  __options = {};

  __bufferedBytes = 0;
  __segmentsLoadingState = [];

  sourceBufferUpdateSubscription;
  sourceBufferUpdateEndSubscription;
  videoCanPlaySubscription;
  videoTimeUpdateSubscription;
  /**
   *
   * @param {HTMLVideoElement} videoElement
   * @param {Object} options
   * @param {string} options.format file format
   * @param {string} options.url address to video stream
   * @param {boolean} options.segmented? should video be segmented
   * @param {string} options.codec video codec
   * @param {number} options.totalSegments? how many segments should video be splitted by
   * @param {number} options.segment? what segment is current
   */
  constructor(videoElement, options) {
    super();
    this.__options = Object.assign({}, options, {
      totalSegments: options.totalSegments < 0 ? 0 : options.totalSegments
    });
    this.__videoElement = videoElement;
    this.__currentSegment =
      options.segment === 0 ? options.segment : options.segment - 1;
    this.__videoElement.src = URL.createObjectURL(this.__mediaSource);
    this.__mimeCodec = options.codec;
    this.__initListeners();
  }

  get video() {
    return this.__videoElement;
  }

  get currentSegmentStart() {
    return this.__currentSegment * this.__segmentLength;
  }

  get currentSegmentEnd() {
    return this.currentSegmentStart + this.__segmentLength;
  }

  __initListeners() {
    const sourceOpenSubscription = fromEvent(this.__mediaSource, 'sourceopen')
      .pipe(first())
      .subscribe(() => {
        this.createMediaSource();
        this.handleSourceOpened();
        this.loadMedia(this.url);
        sourceOpenSubscription.unsubscribe();
      });

    this.videoCanPlaySubscription = fromEvent(this.__videoElement, 'canplay')
      .pipe(
        filter(() => this.__options.segmented),
        first()
      )
      .subscribe(() => {
        this.__segmentDuration =
          this.__videoElement.duration / this.__options.totalSegments;
      });

    this.videoTimeUpdateSubscription = fromEvent(
      this.__videoElement,
      'timeupdate'
    )
      .pipe(filter(() => this.__options.segmented))
      .subscribe(() => {
        this.handleVideoTimeUpdate();
      });
  }

  createMediaSource() {
    if (MediaSource.isTypeSupported(this.__mimeCodec)) {
      this.__sourceBuffer = this.__mediaSource.addSourceBuffer(
        this.__mimeCodec
      );
      this.updatePlayerProps();
    } else {
      return throwError(`Unsupported MIME type or codec: ${this.__mimeCodec}`);
    }
  }

  /**
   * Start reading streamed data
   * @param {string} addr address of video storage
   */
  getStat(addr) {
    return fetch(`${addr}/stat`, {
      method: 'head'
    }).then(response => ({
      fileSize: Number(response.headers.get('Content-Length')),
      type: response.headers.get('Content-Type')
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
    const { segmented, totalSegments, url } = this.__options;
    if (segmented) {
      return this.getStat(url).then(({ fileSize }) => {
        this.__bySegments = segmented;
        this.__segmentLength = Math.floor(fileSize / totalSegments);
        this.__fileSize = fileSize;
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
    const { url } = this.__options;
    return fetch(url, {
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
        this.__bufferedBytes += end - start;
        this.__sourceBuffer.appendBuffer(buffer);
        this.__currentSegment++;
        return this.__videoElement;
      });
  }

  handleSourceOpened() {
    this.__sourceBuffer.onerror = err => console.log(err);
  }

  handleVideoTimeUpdate() {
    if (this.__options.totalSegments === this.__currentSegment) {
      this.finishStream();
    } else if (this.shouldSegmentBeFetched()) {
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
      this.videoCanPlaySubscription.unsubscribe();
      this.videoTimeUpdateSubscription.unsubscribe();
      this.clearQueue();
    }
  }

  shouldSegmentBeFetched() {
    return (
      this.__videoElement.currentTime >
        this.__segmentDuration * this.__currentSegment * 0.5 &&
      !this.__segmentsLoadingState[this.__currentSegment]
    );
  }

  clearQueue() {
    this.__queue = [];
  }
}
