import React, { useRef, useState, useEffect } from "react";
import RecordRTC from "recordrtc";
import io from "socket.io-client";

async function getLiveStream(videoRef, streamRef) {
  const constraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: true,
  };

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Call getUserMedia function here
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoRef.current.srcObject = stream;
    videoRef.current.play();
    streamRef.current = stream;
  } else {
    console.error("getUserMedia is not supported");
  }
}

function LiveVideoCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isTransferComplete, setIsTransferComplete] = useState(true);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const segmentsList = [];
  const [connectionError, setConnectionError] = useState(false);
  const counterRef = useRef(0);
  const streamRef = useRef(null);
  const recorder = useRef(null);

  useEffect(() => {
    // Open a WebSocket connection to the server using socket.io
    if (isCapturing) {
      socketRef.current = io("http://localhost:8000");

      // Handle the connection event
      socketRef.current.on("connect", () => {
        console.log("Connected to server");
        setConnectionError(false);
      });

      // Handle errors
      socketRef.current.on("error", (error) => {
        console.error("Socket error:", error);
        setConnectionError(true);
      });

      // Handle the error event
      socketRef.current.on("connect_error", (error) => {
        console.error("WebSocket error:", error);
        setConnectionError(true);
      });

      // Handle the close event
      socketRef.current.on("disconnect", () => {
        console.log("Disconnected from server");
      });
    }

    getLiveStream(videoRef, streamRef);

    return () => {
      // Close the WebSocket connection when the component unmounts
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isCapturing]);

  const handleStartCapture = () => {
    const stream = streamRef.current;
    const recordRTCConfig = {
      type: "video",
      mimeType: "video/webm",
      video: {
        width: 1280,
        height: 720,
        frameRate: 30,
        bitrate: 5000000,
        codec: "h264",
      },
      timeSlice: 3000,
      ondataavailable: (blob) => {
        counterRef.current++;
        console.log("blob:", blob);
        segmentsList.push({
          segmentNumber: counterRef.current,
          payload: blob,
        });
        const segment = segmentsList.length && segmentsList[0];
        if (segment) {
          console.log(`Sending segment ${segment.segmentNumber} to server `);
          socketRef.current.emit("segment", segment, (ack) => {
            console.log(`Received acknowledge from server: '${ack}'`);
            segmentsList.shift();
          });
        }
      }, // 3 seconds
    };
    recorder.current = RecordRTC(stream, recordRTCConfig);

    recorder.current.startRecording();

    setIsCapturing(true);

    setIsTransferComplete(false);
  };

  const handleStopCapture = () => {
    console.log("stop");

    if (recorder.current) {
      recorder.current.stopRecording(() => {
        console.log("recorder stopped");
      });

      while (segmentsList.length != 0) {
        const segment = segmentsList[0];
        console.log(`Sending segment ${segment.segmentNumber} to server'`);
        socketRef.current.emit("segment", segment, (ack) => {
          console.log(`Received acknowledgement from server: '${ack}'`);
          segmentsList.shift();
        });
      }

      setIsTransferComplete(true);

      socketRef.current.disconnect();
      videoRef.current.pause();
      // videoRef.current = null;
      setIsCapturing(false);
      counterRef.current = 0;
    }
  };

  return (
    <div
      style={{
        height: "90vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        padding: "2em",
      }}
    >
      {!connectionError ? (
        <>
          <video
            ref={videoRef}
            width="1280"
            height="720"
            style={{
              width: "100%",
              height: "100%",
              padding: "1em",
              overflow: "hidden",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isCapturing ? (
              !isTransferComplete && (
                <button
                  style={{ cursor: "pointer" }}
                  onClick={handleStopCapture}
                >
                  Stop
                </button>
              )
            ) : (
              <button
                style={{ cursor: "pointer" }}
                onClick={handleStartCapture}
              >
                Start
              </button>
            )}
          </div>
        </>
      ) : (
        <h1>Server is not reachable</h1>
      )}
    </div>
  );
}

export default LiveVideoCapture;
