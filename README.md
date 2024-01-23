# Lab Assignment 3 submission by 40235325 (Rakshith Raj Gurupura Puttaraju) and 40227041 (Harika Maddukuri)

## client

- The client is the web application developed using React framework
- The client captures the live feed of the device camera at 720p 30fps.
- The camera feed is encoded by H264 codec at 5Mbps bitrate levels.
- The camera feed is segmented every 3 seconds and send to server using socket polling.
- The client has the simple reliable transfer protocol implementation.
- The client also has the user interface which displays all the available mpds stored in a server fetched using GET request to the server and allows copying the mpd link
- Third party libraries used: recordrtc,socketio-client

## server
- The server is the node.js server
- The server receives the encoded mp4 segment as blob.
- The server on client making stop recording request encodes each segment into streams as following:
1. 720p: 1280x720 4000 kbps H.264/AVC and 128 kbps AAC audio (Very High)
2. 480p: 854x480 2000 kbps H.264/AVC and 128 kbps AAC audio (High)
3. 360p: 640x360 1000 kbps H.264/AVC and 128 kbps AAC audio (Medium)
4. 240p: 426x240 700 kbps H.264/AVC and 64 kbps AAC audio (Low)
- Third party libraries used: cors, express, socket.io, nodemon, fluent-ffmpeg and ffmpeg-static.
- PREREQUISITES: ffmpeg must be installed on the device on which the node server is running and should be accessible through the commandline.

## Steps to run the application

1. Install node latest stable version and ffmpeg on the device running the server.
- ffmpeg download link: https://ffmpeg.org/download.html

2. Install nodemon globally in node.

```
npm i -g nodemon
```

3. Open terminal in the client directory and install packages.

```
npm i
```

4. Run the client application.

```
npm start
```

5. Open another terminal in the server directory and install packages.

```
npm i
```

6. Start the server
```
npm run dev
```

7. Start the recording in the client and stop the recording and wait for the server to generate mpd.

8. After server generating the mpd refresh the client app and the entry of the mpd file is found in the table displayed.

9. Copy the link from the table by clicking the button and paste the link in the dash player and load stream.

Dash Player link: 
https://reference.dashif.org/dash.js/v4.5.0/samples/dash-if-reference-player/index.html