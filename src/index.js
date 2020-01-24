import App from './components/App';
import Player from './components/Player';

import tmp from './player.html';

const tmpWrapper = document.createElement('div');
tmpWrapper.innerHTML = tmp;
const playerTmp = tmpWrapper.querySelector('#player');

document.querySelector('#app').appendChild(playerTmp.content);
