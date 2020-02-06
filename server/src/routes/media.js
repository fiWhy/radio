const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { videoFolder, audioFolder } = require('../constants');

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

router.get('/video/:name/:quality/:format', (req, res) => {
  const { name, quality, format } = req.params;
  const path = `${videoFolder}/${name}-${quality}.${format}`;
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
      'Content-Type': `video/${format}`
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': `video/${format}`
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

module.exports = router;
