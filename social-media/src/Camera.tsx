import React, { useRef, useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust this to your Firebase config path

interface CameraProps {
  onClose: () => void;
  userId: string; // <-- changed from number to string
}

export default function Camera({ onClose, userId }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setImagePreview(null);
      setImageName(null);
      setHasSaved(false);
    } catch (err: any) {
      console.error("❌ Error accessing camera:", err.name, err.message);
      alert(`🚫 Error accessing camera: ${err.name}\n${err.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const toggleCamera = () => {
    if (cameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const takePicture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataURL = canvas.toDataURL("image/png");

      setImagePreview(imageDataURL);

      const name = prompt("Name your picture:");
      if (!name) {
        alert("⚠️ No name entered.");
        return;
      }

      setImageName(name);
      setHasSaved(false);
    }
  };

  const saveImageToFirestore = async () => {
    if (!imageName || !imagePreview) {
      console.warn("❌ Missing image name or preview.");
      return;
    }

    try {
      // Reference to the images subcollection under the user document
      const imagesCollectionRef = collection(db, "users", userId, "images"); // userId is string now

      // Add a new document with imageName, imageData and timestamp
      await addDoc(imagesCollectionRef, {
        imageName: imageName,
        imageData: imagePreview,
        imageSavedAt: new Date().toISOString(),
      });

      console.log("✅ Image saved to Firestore subcollection!");
      setHasSaved(true);
    } catch (error) {
      console.error("❌ Error saving image to Firestore:", error);
      alert("Failed to save image. Check console.");
    }
  };

  const toggleRecording = () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    if (!recording) {
      const stream = video.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoURL = URL.createObjectURL(blob);
        console.log("🎥 Video recorded:", videoURL);
        alert("Recording stopped! (Check console)");
      };

      mediaRecorder.start();
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  return (
    <main className="camera-screen">
      <button
        onClick={toggleCamera}
        className="camera-toggle-button"
        style={{ marginBottom: "10px" }}
      >
        {cameraOn ? "📴 Turn Off Camera" : "📷 Turn On Camera"}
      </button>

      <h2>Camera View</h2>
      <button onClick={onClose}>🔙 Back</button>

      <div className="camera-container">
        {imagePreview ? (
          <>
            {imageName && <h3 style={{ margin: "10px 0" }}>📷 {imageName}</h3>}
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: "100%",
                border: "4px solid black",
                borderRadius: "8px",
              }}
            />
            {!hasSaved && (
              <button
                onClick={saveImageToFirestore}
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  fontSize: "16px",
                }}
              >
                💾 Save Image
              </button>
            )}
          </>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="controls">
          <button onClick={takePicture}>📸 Take Picture</button>
          <button onClick={toggleRecording}>
            {recording ? "⏹ Stop Recording" : "🎥 Start Recording"}
          </button>
        </div>
      </div>
    </main>
  );
}
