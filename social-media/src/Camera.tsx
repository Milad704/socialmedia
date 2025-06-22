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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);            // Stores active media stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);   // Stores MediaRecorder for video
  const chunksRef = useRef<Blob[]>([]);                          // Stores video chunks during recording

  // Component state
  const [recording, setRecording] = useState(false);         // Whether recording is active
  const [cameraOn, setCameraOn] = useState(false);           // Whether camera is active
  const [preview, setPreview] = useState<string | null>(null); // Preview image data URL
  const [name, setName] = useState<string | null>(null);     // Name of the captured image
  const [saved, setSaved] = useState(false);                 // Whether image is saved to Firestore

  // Start the camera and stream to video element
  const startCamera = async () => {
    try {
      // Ask for permission and access webcam & mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Reset state
      setCameraOn(true);
      setPreview(null);
      setName(null);
      setSaved(false);
    } catch (err: any) {
      // Show error if camera fails
      alert(`Camera error: ${err.name}\n${err.message}`);
    }
  };

  // Stop camera and clean up tracks
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop()); // Stop all media tracks
    if (videoRef.current) videoRef.current.srcObject = null;
    streamRef.current = null;
    setCameraOn(false);
  };

  // Auto stop camera when component unmounts
  useEffect(() => () => stopCamera(), []);

  // Toggle camera on/off
  const toggleCamera = () => (cameraOn ? stopCamera() : startCamera());

  // Capture image from video and show preview
  const takePicture = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0); // Draw current video frame onto canvas

    const dataUrl = canvas.toDataURL("image/png"); // Convert to base64 PNG
    setPreview(dataUrl);                           // Show preview
    const userInput = prompt("Name your picture:"); // Ask for image name
    if (!userInput) return alert("⚠️ No name entered.");
    setName(userInput.trim());
    setSaved(false);
  };

  // Save captured image to Firestore under /users/{userId}/images/{imageName}
  const saveImage = async () => {
    if (!preview || !name) return;
    try {
      // Ensure user document exists
      await setDoc(doc(db, "users", userId), {}, { merge: true });

      const safeId = name.replace(/\s+/g, "-"); // Sanitize name for use as document ID
      await setDoc(doc(db, "users", userId, "images", safeId), {
        imageName: name,
        imageData: preview,
        imageSavedAt: new Date().toISOString(),
      });

      setSaved(true);
    } catch (err) {
      console.error("❌ Save error:", err);
      alert("Failed to save image.");
    }
  };

  // Start or stop video recording (commented out in UI)
  const toggleRecording = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    if (!recording) {
      const mediaRecorder = new MediaRecorder(video.srcObject as MediaStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Save each recorded chunk
      mediaRecorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);

      // When recording ends, show video link in console
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("🎥 Video URL:", URL.createObjectURL(blob));
        alert("Recording complete! Check console.");
      };

      mediaRecorder.start();
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  // UI Rendering
  return (
    <main className="camera-screen">
      <h1>Camera View</h1>
      {/* Toggle camera button */}
      <button onClick={toggleCamera}>
        {cameraOn ? "📴 Turn Off" : "📷 Turn On"}
      </button>

      {/* Close camera screen */}
      <button onClick={onClose}>🔙 Back</button>

      <div className="camera-container">
        {preview ? (
          <>
            {name && <h3>📷 {name}</h3>}
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", border: "20px solid black", borderRadius: "40px" }}
            />
            {/* Save image button only appears if not yet saved */}
            {!saved && <button onClick={saveImage} style={{ marginTop: 10 }}>💾 Save</button>}
          </>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        )}

        {/* Hidden canvas used for capturing image from video */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Capture buttons */}
        <div className="controls">
          <button onClick={takePicture}>📸 Take Picture</button>
        </div>
      </div>
    </main>
  );
}
