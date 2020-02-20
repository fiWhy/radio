/**
 * Code's been taken and adapted from https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_manipulation
 */

var processor = {
  timerCallback: function() {
    if (this.video.paused || this.video.ended) {
      return;
    }
    this.computeFrame();
    var self = this;
    setTimeout(function() {
      self.timerCallback();
    }, 16); // roughly 60 frames per second
  },

  doLoad: function(canvas, video, { width, height }) {
    this.video = video;
    this.c1 = canvas;
    this.ctx1 = this.c1.getContext('2d');
    var self = this;

    this.video.addEventListener(
      'play',
      function() {
        self.width = width || video.width;
        self.height = height || video.height;
        self.timerCallback();
      },
      false
    );
  },

  computeFrame: function() {
    this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
    var frame = this.ctx1.getImageData(0, 0, this.width, this.height);
    var l = frame.data.length / 4;

    for (var i = 0; i < l; i++) {
      var grey =
        (frame.data[i * 4 + 0] +
          frame.data[i * 4 + 1] +
          frame.data[i * 4 + 2]) /
        3;

      frame.data[i * 4 + 0] = grey;
      frame.data[i * 4 + 1] = grey;
      frame.data[i * 4 + 2] = grey;
    }
    this.ctx1.putImageData(frame, 0, 0);

    return;
  }
};

export { processor };
