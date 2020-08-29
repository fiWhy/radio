import { processor } from '../lib/stream';

export default (wrapper) => {
  const theatreContent = document.querySelector(
    '.video__player__theatre__content'
  );

  theatreContent.classList.add('centered');
  const canvas = document.createElement('canvas');
  const video = document.createElement('video');
  wrapper.appendChild(canvas);

  processor.doLoad(canvas, video, {
    width: 768,
    height: 480,
  });

  const mimeCodec = 'video/mp4; codecs="avc1.64001F, mp4a.40.2"';
  const videoName = 'video-360';

  const segmentsAmount = 5;

  wrapper.append(video);

  const control = document.createElement('button');
  control.innerText = 'Play';

  control.addEventListener('click', ({ target }) => {
    if (video.paused) {
      target.textContent = 'Pause';
      video.play();
    } else {
      target.textContent = 'Play';
      video.pause();
    }
  });

  canvas.width = 768;
  canvas.height = 480;

  wrapper.append(control);

  const getInfo = (name) =>
    fetch(`http://localhost:3000/media/video/${name}-fragmented/mp4/stat`, {
      method: 'HEAD',
    }).then((response) => response.headers);

  const load = (name, byteRangeStart, byteRangeEnd) =>
    fetch(`http://localhost:3000/media/video/${name}-fragmented/mp4`, {
      headers: {
        Range: `${byteRangeStart}-${byteRangeEnd}`,
      },
    }).then((response) => response.arrayBuffer());

  const initMSE = () =>
    new Promise((res, rej) => {
      if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
        var mediaSource = new MediaSource();

        video.src = URL.createObjectURL(mediaSource);
        mediaSource.addEventListener('sourceopen', () => {
          const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
          res({ mediaSource, sourceBuffer });
        });
      } else {
        rej(`Unsupported MIME type or codec: ${mimeCodec}`);
      }
    });

  getInfo(videoName)
    .then((info) => {
      const size = info.get('Content-Length');
      const chunkSize = Math.round(size / segmentsAmount);
      return initMSE().then((result) => ({
        ...result,
        chunkSize,
        size,
      }));
    })
    .then(({ mediaSource, chunkSize, sourceBuffer, size }) => {
      let segmentIsLoading = false;
      let currentSegment = 0;

      const updateSegment = (segment) => {
        const segmentStartsFrom = segment * chunkSize + segment;

        segmentIsLoading = true;
        load(
          videoName,
          segmentStartsFrom,
          Math.min(segmentStartsFrom + chunkSize, size - 1)
        ).then((buf) => {
          sourceBuffer.appendBuffer(buf);
          segmentIsLoading = false;
        });
      };

      video.addEventListener('timeupdate', (e) => {
        const segmentDuration = video.duration / segmentsAmount;
        const shouldBeLoaded =
          currentSegment < segmentsAmount &&
          video.currentTime > segmentDuration * (currentSegment + 1) * 0.5 &&
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
};
