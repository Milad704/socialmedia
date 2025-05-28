import React, { useState } from "react";
import Login from "./login";
import "./App.css";

export default function App() {
  // State for logged in status and username
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");

  // Handler receives username (string), so type it
  const handleLogin = (username: string) => {
    setUsername(username);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <main className="main-screen">
      <h2>Hello, {username}!</h2>
      {/* We'll add Chat, Camera, etc here */}
    </main>
  );
}
