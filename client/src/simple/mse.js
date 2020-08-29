export default (wrapper) => {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  const mimeCodec = 'video/mp4; codecs="avc1.64001F, mp4a.40.2"';

  wrapper.append(video);

  const getVideo = (name) =>
    fetch(`http://localhost:3000/media/video/${name}/mp4`).then((response) =>
      response.arrayBuffer()
    );

  if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
    var mediaSource = new MediaSource();

    video.src = URL.createObjectURL(mediaSource);
    mediaSource.addEventListener('sourceopen', () => {
      const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
      getVideo('video-360-fragmented').then((buf) => {
        sourceBuffer.addEventListener('updateend', function (_) {
          mediaSource.endOfStream();
        });
        sourceBuffer.appendBuffer(buf);
      });
    });
  } else {
    console.error('Unsupported MIME type or codec: ', mimeCodec);
  }
};
