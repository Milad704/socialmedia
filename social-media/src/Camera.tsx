import React, { useRef, useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

interface CameraProps {
  onClose: () => void;
  userId: string; // Actually the username
}

export default function Camera({ onClose, userId }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  const startCamera = async () => {
    console.log("📸 Camera starting...");
    console.log("🧠 userId is:", userId);

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
      console.error("❌ Camera error:", err.name, err.message);
      alert(`🚫 Camera error: ${err.name}\n${err.message}`);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
  };

  const toggleCamera = () => {
    cameraOn ? stopCamera() : startCamera();
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

      setImageName(name.trim());
      setHasSaved(false);
    }
  };

  const saveImageToFirestore = async () => {
    if (!imageName || !imagePreview) {
      console.warn("❌ No image name or preview");
      return;
    }

    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {}, { merge: true });

      const safeId = imageName.replace(/\s+/g, "-");
      const imageDocRef = doc(db, "users", userId, "images", safeId);

      await setDoc(imageDocRef, {
        imageName,
        imageData: imagePreview,
        imageSavedAt: new Date().toISOString(),
      });

      console.log(`✅ Image saved: users/${userId}/images/${safeId}`);
      setHasSaved(true);
    } catch (error) {
      console.error("❌ Firestore save error:", error);
      alert("Failed to save image.");
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
        console.log("🎥 Video URL:", videoURL);
        alert("Recording complete! Check console.");
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
       <h1>Camera View</h1>
      <button onClick={toggleCamera} className="camera-toggle-button">
        {cameraOn ? "📴 Turn Off Camera" : "📷 Turn On Camera"}
      </button>
      <button onClick={onClose}>🔙 Back</button>

      <div className="camera-container">
        {imagePreview ? (
          <>
            {imageName && <h3>📷 {imageName}</h3>}
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                width: "100%",
                border: "20px solid black",
                borderRadius: "40px",
              }}
            />
            {!hasSaved && (
              <button
                onClick={saveImageToFirestore}
                style={{ marginTop: "10px" }}
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
          {/* <button onClick={toggleRecording}>
            {recording ? "⏹ Stop Recording" : "🎥 Start Recording"}
          </button> */}
        </div>
      </div>
    </main>
  );
}
