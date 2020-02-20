const serverUrl = 'http://localhost:3000';
const codecs = {
  mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
  webm: 'video/webm; codecs="vorbis,vp8"'
};

const formatUrlToServer = url => `${serverUrl}${url}`;

export { serverUrl, codecs, formatUrlToServer };
