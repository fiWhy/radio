const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { videoFolder, audioFolder } = require('../constants');
const musicMetadata = require('music-metadata');

const paths = {
  audio: audioFolder,
  video: videoFolder
};

const streamFile = type => (req, res) => {
  const { segment, format } = req.params;
  const path = `${paths[type]}/${segment}.${format}`;
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': `${type}/${format}`
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': `${type}/${format}`
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
};

const statFile = type => (req, res) => {
  const { segment, format } = req.params;
  const path = `${paths[type]}/${segment}.${format}`;
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  if (type === 'audio') {
    musicMetadata.parseFile(path).then(metadata => {
      res.setHeader('Access-Control-Expose-Headers', 'X-Duration');
      res.setHeader('X-Duration', metadata.format.duration);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Content-Type', `${type}/${format}`);
      res.send();
    });
  } else {
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', `${type}/${format}`);
    res.send();
  }
};

router.get('/video', (req, res) => {
  fs.readdir(videoFolder, (err, files) => {
    const response = files
      .map(file => {
        const splittedGeneral = file.split('-');
        if (splittedGeneral[1]) {
          const splittedInfo = splittedGeneral[1].split('.');
          const name = splittedGeneral[0];
          const quality = splittedInfo[0];
          const format = splittedInfo[1];
          return {
            name,
            quality,
            format
          };
        }
        return;
      })
      .filter(fileInfo => fileInfo);
    res.send(response);
  });
});

router.get('/video/:segment/:format', streamFile('video'));
router.get('/audio/:segment/:format', streamFile('audio'));

router.head('/video/:segment/:format/stat', statFile('video'));
router.head('/audio/:segment/:format/stat', statFile('audio'));

module.exports = router;
