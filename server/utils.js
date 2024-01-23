const fs = require("fs");
const ffmpegPath = require("ffmpeg-static").path;
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const ffmpegStatic = require("ffmpeg-static");
const { Readable } = require("stream");

// Tell fluent-ffmpeg where it can find FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

async function readVideoBlobAsBuffer(videoBlob) {
  const buffer = await videoBlob.arrayBuffer();

  return Buffer.from(buffer);
}

function createNewDirectory(callback) {
  const directoryPath = "./videos";
  let newDirectoryPath;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
    console.log(`Created directory ${directoryPath}`);
  } else {
    console.log(`Directory ${directoryPath} already exists`);
  }

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log(`Error reading directory: ${err}`);
      return;
    }

    const directories = files.filter((file) =>
      fs.statSync(`${directoryPath}/${file}`).isDirectory()
    );
    const count = directories.length;

    const newDirectory = `Video${count + 1}`;
    newDirectoryPath = `${directoryPath}/${newDirectory}`;

    if (!fs.existsSync(newDirectoryPath)) {
      fs.mkdirSync(newDirectoryPath);
      console.log(`Created ${newDirectoryPath}`);
    } else {
      console.log(`Directory ${newDirectoryPath} already exists`);
    }

    callback(newDirectoryPath);
  });
}

function saveSegmentAsVideo(videoBlob) {
  // Construct the output file path
  createNewDirectory(async (dirpath) => {
    const outputPath = `${dirpath}/1.mp4`;

    // Convert the video blob to a buffer

    // const buffer = Buffer.from(videoBuffer);

    const videoBuffer = await readVideoBlobAsBuffer(videoBlob);

    const videoStream = new Readable({
      read() {
        this.push(videoBuffer);
        this.push(null);
      },
    });

    const command = ffmpeg(videoStream)
      .addInputOption("-re")
      .addOutputOptions([
        "-map 0:v:0",
        "-map 0:v:0",
        "-map 0:v:0",
        "-map 0:v:0",
        "-map 0:a:0",
        "-map 0:a:0",
      ])
      .audioCodec("aac")
      .videoCodec("libx264")
      .addOption("-b:v:0", "300k")
      .addOption("-s:v:0", "426x240")
      .addOption("-b:v:1", "600k")
      .addOption("-s:v:1", "640x360")
      .addOption("-b:v:2", "1000k")
      .addOption("-s:v:2", "854x480")
      .addOption("-b:v:3", "4000k")
      .addOption("-s:v:3", "1280x720")
      .addOption("-profile:v:3", "high")
      .addOption("-profile:v:2", "high")
      .addOption("-profile:v:1", "main")
      .addOption("-profile:v:0", "baseline")
      .addOption("-bf", "1")
      .addOption("-keyint_min", "120")
      .addOption("-g", "120")
      .addOption("-sc_threshold", "0")
      .addOption("-b_strategy", "0")
      .addOption("-ar:a:1", "22050")
      .addOption("-b:a:0", "64k")
      .addOption("-b:a:1", "128k")
      .addOption("-use_timeline", "1")
      .addOption("-use_template", "1")
      .addOption("-adaptation_sets", "id=0,streams=v id=1,streams=a")
      .format("dash")
      .output(`${dirpath}/manifest.mpd`)
      .on("progress", (progress) => {
        console.log(`Processing: ${JSON.stringify(progress)}`);
      })
      .on("end", () => console.log("MPEG-DASH manifest created successfully!"))
      .on("error", (err) => console.error(err));

    command.run();
  });
}

function getMPDFiles() {
  const parentFolderPath = path.join(__dirname, "videos"); // path to parent folder
  const mpdFilePaths = []; // array to store MPD file URLs
  fs.readdirSync(parentFolderPath).forEach((folderName) => {
    const folderPath = path.join(parentFolderPath, folderName);
    // check if folder exists and is a directory
    if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
      // loop through files in folder
      fs.readdirSync(folderPath).forEach((fileName) => {
        const filePath = path.join(folderPath, fileName);
        // check if file is an MPD file
        if (
          fs.lstatSync(filePath).isFile() &&
          path.extname(fileName) === ".mpd"
        ) {
          const relativePath = path
            .join("/videos", folderName, fileName)
            .replace(/\\/g, "/");

          const mpdFile = {
            video: folderName,
            mpd: `http://localhost:8000${relativePath}`,
          };
          mpdFilePaths.push(mpdFile);
        }
      });
    }
  });
  return mpdFilePaths;
}
module.exports = { saveSegmentAsVideo, getMPDFiles };
