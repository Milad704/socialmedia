// Import necessary hooks and Firebase functions
import React, { useRef, useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Define props the Camera component expects
interface CameraProps {
  onClose: () => void;    // Function to close the camera view
  userId: string;         // The current user's ID (username)
}

// Main Camera component
export default function Camera({ onClose, userId }: CameraProps) {
  // Refs for accessing video and canvas elements

  // A ref to the <video> element in the DOM
  // .current will eventually point to the actual <video> so we can control it (like assigning srcObject)
  const videoRef = useRef<HTMLVideoElement>(null);

  // A ref to a hidden <canvas> element in the DOM
  // We use it to draw a frame from the video when taking a snapshot
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A ref to store the active MediaStream from the webcam
  // This holds the live video/audio stream so we can stop it later or use it elsewhere
  const streamRef = useRef<MediaStream | null>(null);

  // A ref to store a MediaRecorder instance
  // MediaRecorder is used to record the live MediaStream into video chunks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // A ref to store video chunks (Blob objects) while recording
  // These chunks are combined into a single video file when recording stops
  const chunksRef = useRef<Blob[]>([]);

  // Component state
  const [recording, setRecording] = useState(false);         // Whether recording is active
  const [cameraOn, setCameraOn] = useState(false);           // Whether camera is active
  const [preview, setPreview] = useState<string | null>(null); // Preview image data URL
  const [name, setName] = useState<string | null>(null);     // Name of the captured image
  const [saved, setSaved] = useState(false);                 // Whether image is saved to Firestore

  // Start the camera and stream to video element
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); //navigator is browser itself
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Reset state
        setCameraOn(true);
        setPreview(null);
        setName(null);
        setSaved(false);
      }
    } catch (err: any) {
      alert(`Camera error: ${err.name}\n${err.message} `)
    }
  };


  // Stop camera and clean up tracks
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop()); // Stop all media tracks: video track, and audio track
    if (videoRef.current) {
      videoRef.current.srcObject = null; // stops video stream
      streamRef.current = null;
      setCameraOn(false);
    }
  };


  // Auto stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []) // [] means nothing, so use effect only run once, if we wanted to run it again, put confidition in []


  // Toggle camera on/off
  const toggleCamera = () => {
    if (cameraOn === true) {
      stopCamera();
    } else {
      startCamera();
    }
  }

  // Capture image from video and show preview
  const takePicture = () => {
    const video = videoRef.current; // live camera feed
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const imageContext = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    imageContext?.drawImage(video, 0, 0); // draw a image based off current video frame

    const imageUrl = canvas.toDataURL("image/png");
    const imageName = prompt("Name your picture: ");

    if (!imageName || imageName.length === 0) { // how to stop user from writting  nothing
      return alert("No name entered");
    }

    setName(imageName.trim());
    setPreview(imageUrl);

    setSaved(false);
  }

  // Save captured image to Firestore under /users/{userId}/images/{imageName}
  const saveImage = async () => {
    if (!preview || !name) {
      return;
    }
    const safeName = name.replace(/\s+/g, "-");
    await setDoc(doc(db, "users", userId, "images", safeName), {
      imageName: name,
      imageData: preview,
      imageSavedAt: new Date().toISOString(),
    });
    setSaved(true);

  }

  // Start or stop video recording (commented out in UI)
  // const toggleRecording = () => {
  //   const video = videoRef.current;
  //   if (!video || !video.srcObject) return;

  //   if (!recording) {
  //     const mediaRecorder = new MediaRecorder(video.srcObject as MediaStream);
  //     mediaRecorderRef.current = mediaRecorder;
  //     chunksRef.current = [];

  //     // Save each recorded chunk
  //     mediaRecorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);

  //     // When recording ends, show video link in console
  //     mediaRecorder.onstop = () => {
  //       const blob = new Blob(chunksRef.current, { type: "video/webm" });
  //       console.log("🎥 Video URL:", URL.createObjectURL(blob));
  //       alert("Recording complete! Check console.");
  //     };

  //     mediaRecorder.start();
  //     setRecording(true);
  //   } else {
  //     mediaRecorderRef.current?.stop();
  //     setRecording(false);
  //   }
  // };

  // UI Rendering
  return (
    <main className="camera-screen">
      <h1>Camera View</h1>
      {/* Toggle camera button */}
      <button onClick={toggleCamera}>
        {cameraOn ? "Turn Off" : "Turn On"}
      </button>

      {/* Close camera screen */}
      <button onClick={onClose}>Return </button>

      <div className="camera-container">
        {preview ? ( // if preview is null or not showing, show camera instead
          <>
            {name && <h3>📷 {name}</h3>}
            <img
              src={preview}
              alt="Preview"
              style={{ width: "50px", border: "5px solid black", borderRadius: "5px" }}
            />
            {/* Save image button only appears if not yet saved */}
            {!saved && <button onClick={saveImage} style={{ marginTop: 10 }}> Save Image</button>}
          </>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="controls">
          <button onClick={takePicture}>📸 Take Picture</button>
        </div>
      </div>
    </main>
  );
}
