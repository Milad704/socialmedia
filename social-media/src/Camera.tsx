// Camera.tsx
import React, { useRef, useState, useEffect } from "react";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
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
      console.log("📸 Picture taken:", imageDataURL);
      alert("Picture taken! (Check console)");
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
    <div className="camera-container">
      <video ref={videoRef} autoPlay playsInline className="camera-feed" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="controls">
        <button onClick={takePicture}>📸 Take Picture</button>
        <button onClick={toggleRecording}>
          {recording ? "⏹ Stop Recording" : "🎥 Start Recording"}
        </button>
      </div>
    </div>
  );
}
