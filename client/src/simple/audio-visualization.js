import visualize from '../lib/visualizer';

export default () => {
  const audioWrapper = document.body;
  document.body.classList.add('visualizer');
  document.querySelector('#app').remove();
  const canvas = document.createElement('canvas');
  const callToAction = document.createElement('div');
  callToAction.classList.add('call-to-action');
  callToAction.textContent = 'Click to play!';

  canvas.width = 460;
  canvas.height = 320;

  const sourceElement = document.createElement('audio');
  sourceElement.controls = false;
  audioWrapper.appendChild(canvas);
  audioWrapper.appendChild(callToAction);

  const mimeCodec = 'audio/mpeg';
  const audioName = 'audio';

  const segmentsAmount = 5;

  audioWrapper.append(sourceElement);

  const getInfo = (name) =>
    fetch(`http://localhost:3000/media/audio/${name}/mp3/stat`, {
      method: 'HEAD',
    }).then((response) => response.headers);

  const load = (name, byteRangeStart, byteRangeEnd) =>
    fetch(`http://localhost:3000/media/audio/${name}/mp3`, {
      headers: {
        Range: `${byteRangeStart}-${byteRangeEnd}`,
      },
    }).then((response) => response.arrayBuffer());

  const initMSE = () =>
    new Promise((res, rej) => {
      if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        var mediaSource = new MediaSource();

        sourceElement.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener('sourceopen', () => {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
          res({ mediaSource, sourceBuffer });
        });
      } else {
        rej(`Unsupported MIME type or codec: ${mimeCodec}`);
      }
    });

  getInfo(audioName)
    .then((info) => {
      const size = info.get('Content-Length');
      const duration = info.get('X-Duration');
      const chunkSize = Math.round(size / segmentsAmount);
      return initMSE().then((result) => ({
        ...result,
        chunkSize,
        size,
        duration,
      }));
    })
    .then(({ mediaSource, chunkSize, sourceBuffer, size, duration }) => {
      let segmentIsLoading = false;
      let currentSegment = 0;

      const updateSegment = (segment) => {
        const segmentStartsFrom = segment * chunkSize + segment;

        segmentIsLoading = true;
        load(
          audioName,
          segmentStartsFrom,
          Math.min(segmentStartsFrom + chunkSize, size - 1)
        ).then((buf) => {
          sourceBuffer.appendBuffer(buf);
          segmentIsLoading = false;
        });
      };

      sourceElement.addEventListener('timeupdate', (e) => {
        const segmentDuration = duration / segmentsAmount;
        const shouldBeLoaded =
          currentSegment < segmentsAmount &&
          sourceElement.currentTime >
            segmentDuration * (currentSegment + 1) * 0.5 &&
          !segmentIsLoading;

        if (shouldBeLoaded) {
          updateSegment(++currentSegment);
        }
      });

      sourceBuffer.addEventListener('updateend', function (_) {
        if (currentSegment > segmentsAmount) {
          mediaSource.endOfStream();
        }
      });

      updateSegment(0);
    });

  visualize(canvas, sourceElement);
};
