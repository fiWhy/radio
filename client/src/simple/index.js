import video from './video';
import mse from './mse';
import mseBuffering from './mse-buffering';
import audio from './audio';
import audioVisualization from './audio-visualization';
import videoCanvas from './mse-buffering-canvas';

const elementWrapper = document.querySelector(
  '.video__player__theatre__content'
);

video(elementWrapper);
// mse(elementWrapper);
// mseBuffering(elementWrapper);
// audio(elementWrapper);
// audioVisualization();
// videoCanvas(elementWrapper);
