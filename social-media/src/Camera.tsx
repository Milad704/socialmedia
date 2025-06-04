import React, { useRef, useState, useEffect } from "react";
import { getDatabase, ref, push, set } from "firebase/database";

interface CameraProps {
  onClose: () => void;
  userId: number;
}

export default function Camera({ onClose, userId }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null); // for freezing camera

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("❌ Error accessing camera:", err.name, err.message);
        alert(`🚫 Error accessing camera: ${err.name}\n${err.message}`);
      });
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

      // Freeze frame
      setImagePreview(imageDataURL);

      // Ask for name
      const imageName = prompt("Name your picture:");
      if (imageName && userId !== null) {
        const db = getDatabase();
        const newImageRef = push(ref(db, "images"));
        set(newImageRef, {
          name: imageName,
          userId,
          imageURL: imageDataURL,
        })
          .then(() => {
            alert("✅ Image saved to database!");
          })
          .catch((err) => {
            console.error("❌ Error saving image:", err);
            alert("Failed to save image.");
          });
      } else {
        alert("⚠️ No name entered or invalid user.");
      }
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
      <h2>Camera View</h2>
      <button onClick={onClose}>🔙 Back</button>

      <div className="camera-container">
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              width: "100%",
              border: "4px solid black",
              borderRadius: "8px",
            }}
          />
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
