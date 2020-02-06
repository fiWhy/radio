const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const { videoFolder, audioFolder } = require('./constants');

const routes = require('./routes');
app.use(cors());
app
  .use('/video', express.static(videoFolder))
  .use('/audio', express.static(audioFolder));

app.get('/', (req, res) => res.send('Hello World!'));
app.use('/media', routes.media);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
