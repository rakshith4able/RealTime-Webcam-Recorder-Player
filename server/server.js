const fs = require("fs");
const utils = require("./utils");
const path = require("path");
const express = require("express");
const app = express();
const cors = require("cors");
const { Readable } = require("stream");

app.use(cors());
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  reconnection: true, // enable reconnection
  reconnectionAttempts: 10, // try to reconnect 10 times
  reconnectionDelay: 1000, // wait 1 second before attempting to reconnect
  reconnectionDelayMax: 5000, // wait at most 5 seconds before attempting to reconnect
  cors: true,
});

const VIDEO_DIR = "./videos";

app.use(express.static(__dirname + "videos"));
app.use("/:file", express.static(path.join(__dirname, "videos")));

// Create the videos directory if it doesn't exist
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR);
}

app.get("/mpds", (req, res) => {
  const mpdsList = utils.getMPDFiles();
  res.json(mpdsList);
});

app.get("/:filePath", (req, res) => {
  // Send the MPD file as the response
  const path = req.params.filePath;
  if (fs.existsSync(path)) {
    console.log(`${path} exists`);
  } else {
    console.log(`${path} does not exist`);
  }
});

// Handle incoming socket connections
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  const segmentsList = [];

  socket.on("segment", (segment, ack) => {
    console.log(
      `Received segment '${segment.segmentNumber}' from client ${socket.id}`
    );
    segmentsList.push(segment);
    const ackPayload = `Segment '${segment.segmentNumber}' received`;
    console.log(
      `Sending acknowledgement for segment '${segment.segmentNumber}' to client ${socket.id}: '${ackPayload}'`
    );
    ack(ackPayload);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    console.log(segmentsList);

    if (segmentsList.length > 0) {
      // Remove duplicates by segmentNumber
      const unique = Array.from(
        new Set(segmentsList.map((obj) => obj.segmentNumber))
      ).map((segmentNumber) =>
        segmentsList.find((obj) => obj.segmentNumber === segmentNumber)
      );

      // Sort the list by the 'segmentNumber' property
      const sortedSegmentsList = unique.sort(
        (a, b) => a.segmentNumber - b.segmentNumber
      );

      const payloads = sortedSegmentsList.map((segment) => segment.payload);
      console.log("payloads:", payloads);
      const mp4Buffer = new Blob(payloads, { type: "video/webm" });
      utils.saveSegmentAsVideo(mp4Buffer);
    }
  });
});

// Serve the videos directory statically
// app.use(express.static(VIDEO_DIR));

// Start the server
server.listen(8000, () => {
  console.log("Server listening on port 8000");
});
