import React, { useState } from "react";
import Login from "./Login";
import Camera from "./camera"; // ← IMPORT CAMERA COMPONENT
import "./App.css";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const handleLogin = (username: string, id: number) => {
    setUsername(username);
    setUserId(id);
    setLoggedIn(true);
  };

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  return (
    <main className="main-screen">
      <h2>
        Hello, {username} (ID: {userId})
      </h2>
      <Camera /> {/* ← RENDERS THE CAMERA PAGE */}
    </main>
  );
}
