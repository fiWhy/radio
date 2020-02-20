# Media Stream

Run server from `server` folder with command:
```bash
npm start
```

Run any example from `client` folder after running with a command:

```bash
npm start
```

Server is watching files from `/assets/video` folder.
Request should be buid like:
`http://localhost:3000/media/[video/audio]/<filename>/format`

Example

`http://localhost:3000/media/audio/audio/mp3`



## ! Fragment your mp4 format media before using MSE (Media Source Extension)
To make your video working with `Chrome` use https://www.bento4.com/ utilities, like:
```bash 
mp4fragment <non-fragmented-video> <name-of-output-fragmented-video>
```

To create dash manifest with video segmentation use:


```bash
mp4dash [...<file-address>]
```

To get info about codecs used for media files:

```bash
mp4info <file-address> | grep Codecs
```