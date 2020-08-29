export default (wrapper) => {
  const video = document.createElement('video');
  video.setAttribute('controls', '');

  video.src = 'http://localhost:3000/video/video-360.mp4';
  wrapper.append(video);
};
