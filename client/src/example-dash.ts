/**
 * Dashjs's been imported to index.html from CDN https://cdn.dashjs.org/latest/dash.all.min.js
 */

export default videoWrapper => {
  const videoElement = document.createElement('video');
  videoElement.controls = true;
  videoWrapper.appendChild(videoElement);
  const url = 'http://localhost:3000/video/output/stream.mpd';
  const player = dashjs.MediaPlayer().create({
    streamController: true
  });
  player.updateSettings({
    debug: {
      logLevel: dashjs.Debug.LOG_LEVEL_DEBUG
    },

    abr: {
      autoSwitchBitrate: {
        video: true
      }
    }
  });
  player.initialize(videoElement, url, true);
};
