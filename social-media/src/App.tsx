import React, { useState } from "react";
import Login from "./Login";
import "./App.css";
import Camera from "./Camera";
import AddFriendModal from "./AddFriendModal";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const handleLogin = (username: string, id: number) => {
    setUsername(username);
    setUserId(id);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (showCamera) {
    return <Camera onClose={() => setShowCamera(false)} userId={userId!} />;
  }

  if (showGallery) {
    return (
      <main className="main-screen">
        <h2>Gallery (Coming Soon)</h2>
        <button onClick={() => setShowGallery(false)}>Back</button>
      </main>
    );
  }

  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* Left strip */}
        <div className="white_strip">
          <button onClick={() => setShowAddFriend(true)}>➕ Add Friend</button>
        </div>

        {/* Center strip with buttons */}
        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}>📸 Open Camera</button>
            <button onClick={() => setShowGallery(true)}>
              🖼️ View Pictures
            </button>
          </div>
        </div>
      </div>

      {/* Conditionally render AddFriendModal */}
      {showAddFriend && (
        <AddFriendModal onClose={() => setShowAddFriend(false)} />
      )}
    </main>
  );
}
